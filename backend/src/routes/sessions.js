import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    let queryText;
    let queryParams;

    if (req.user.role === 'parent') {
      queryText = `
        SELECT ts.*, s.full_name as student_name, p.full_name as therapist_name
        FROM therapy_sessions ts
        JOIN students s ON ts.student_id = s.id
        JOIN profiles p ON ts.therapist_id = p.id
        WHERE s.parent_id = $1
        ORDER BY ts.session_date DESC
      `;
      queryParams = [req.user.id];
    } else if (req.user.role === 'therapist') {
      queryText = `
        SELECT ts.*, s.full_name as student_name, p.full_name as therapist_name
        FROM therapy_sessions ts
        JOIN students s ON ts.student_id = s.id
        JOIN profiles p ON ts.therapist_id = p.id
        WHERE ts.therapist_id = $1
        ORDER BY ts.session_date DESC
      `;
      queryParams = [req.user.id];
    } else {
      queryText = `
        SELECT ts.*, s.full_name as student_name, p.full_name as therapist_name
        FROM therapy_sessions ts
        JOIN students s ON ts.student_id = s.id
        JOIN profiles p ON ts.therapist_id = p.id
        ORDER BY ts.session_date DESC
      `;
      queryParams = [];
    }

    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.post(
  '/',
  authorize('therapist', 'school_admin', 'system_admin'),
  [
    body('studentId').isUUID(),
    body('sessionDate').isISO8601(),
    body('durationMinutes').optional().isInt({ min: 1 }),
    body('focusArea').optional().isIn(['academic', 'emotional', 'linguistic', 'sensory', 'behavioral', 'life_skills']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, sessionDate, durationMinutes, focusArea } = req.body;

    try {
      const result = await query(
        `INSERT INTO therapy_sessions (student_id, therapist_id, session_date, duration_minutes, focus_area)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [studentId, req.user.id, sessionDate, durationMinutes, focusArea]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
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

    const { status, durationMinutes, focusArea, videoUrl } = req.body;

    try {
      const result = await query(
        `UPDATE therapy_sessions
         SET status = COALESCE($1, status),
             duration_minutes = COALESCE($2, duration_minutes),
             focus_area = COALESCE($3, focus_area),
             video_url = COALESCE($4, video_url)
         WHERE id = $5 AND therapist_id = $6 RETURNING *`,
        [status, durationMinutes, focusArea, videoUrl, req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found or unauthorized' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ error: 'Failed to update session' });
    }
  }
);

export default router;
