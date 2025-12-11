import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/parents', async (req, res) => {
  try {
    const result = await query(
        'SELECT id, full_name, email FROM profiles WHERE role = $1 ORDER BY full_name ASC',
        ['parent']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({ error: 'Failed to fetch parents' });
  }
});

router.get('/:id/stats', param('id').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const studentId = req.params.id;

    const [progress, goals, sessions] = await Promise.all([
      query(
          `SELECT AVG(metric_value) as avg_progress
         FROM progress_tracking
         WHERE student_id = $1 AND tracking_date >= NOW() - INTERVAL '30 days'`,
          [studentId]
      ),
      query(
          `SELECT COUNT(*) as total,
         COUNT(CASE WHEN jsonb_extract_path_text(goals, 'status') = 'completed' THEN 1 END) as completed
         FROM iep_plans
         WHERE student_id = $1 AND status = 'active'`,
          [studentId]
      ),
      query(
          `SELECT COUNT(*) as total
         FROM therapy_sessions
         WHERE student_id = $1 AND status = 'completed'`,
          [studentId]
      ),
    ]);

    const stats = {
      overallProgress: progress.rows[0]?.avg_progress || 0,
      activeGoals: goals.rows[0]?.total || 0,
      completedGoals: goals.rows[0]?.completed || 0,
      totalSessions: sessions.rows[0]?.total || 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ error: 'Failed to fetch student stats' });
  }
});

router.get('/', async (req, res) => {
  try {
    let queryText;
    let queryParams;

    if (req.user.role === 'parent') {
      queryText = 'SELECT * FROM students WHERE parent_id = $1 ORDER BY created_at DESC';
      queryParams = [req.user.id];
    } else if (req.user.role === 'therapist') {
      queryText = `
        SELECT DISTINCT s.* FROM students s
        WHERE s.primary_therapist_id = $1
        OR EXISTS (
          SELECT 1 FROM therapy_sessions ts
          WHERE ts.student_id = s.id AND ts.therapist_id = $1
        )
        ORDER BY s.created_at DESC
      `;
      queryParams = [req.user.id];
    } else if (req.user.role === 'school_admin') {
      queryText = `
        SELECT DISTINCT s.* FROM students s
        JOIN student_school_enrollment sse ON s.id = sse.student_id
        JOIN school_staff ss ON ss.school_id = sse.school_id
        WHERE ss.user_id = $1
        ORDER BY s.created_at DESC
      `;
      queryParams = [req.user.id];
    } else if (req.user.role === 'system_admin') {
      queryText = 'SELECT * FROM students ORDER BY created_at DESC';
      queryParams = [];
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.get('/:id', param('id').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const result = await query('SELECT * FROM students WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = result.rows[0];

    const hasAccess =
        req.user.role === 'system_admin' ||
        student.parent_id === req.user.id ||
        student.primary_therapist_id === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

router.post(
    '/',
    authorize('therapist', 'school_admin', 'system_admin'),
    [
      body('fullName').notEmpty().trim(),
      body('dateOfBirth').isDate(),
      body('parentId').isUUID(),
      body('gender').optional().isIn(['male', 'female', 'other']),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fullName, dateOfBirth, parentId, gender, emergencyContact, medicalNotes } = req.body;

      try {
        const result = await query(
            `INSERT INTO students (full_name, date_of_birth, parent_id, gender, primary_therapist_id, emergency_contact, medical_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [fullName, dateOfBirth, parentId, gender, req.user.id, emergencyContact, medicalNotes]
        );

        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ error: 'Failed to create student' });
      }
    }
);

router.put(
    '/:id',
    param('id').isUUID(),
    authorize('therapist', 'school_admin', 'system_admin'),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fullName, dateOfBirth, gender, emergencyContact, medicalNotes } = req.body;

      try {
        const result = await query(
            `UPDATE students
         SET full_name = COALESCE($1, full_name),
             date_of_birth = COALESCE($2, date_of_birth),
             gender = COALESCE($3, gender),
             emergency_contact = COALESCE($4, emergency_contact),
             medical_notes = COALESCE($5, medical_notes)
         WHERE id = $6 RETURNING *`,
            [fullName, dateOfBirth, gender, emergencyContact, medicalNotes, req.params.id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Student not found' });
        }

        res.json(result.rows[0]);
      } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Failed to update student' });
      }
    }
);

export default router;
