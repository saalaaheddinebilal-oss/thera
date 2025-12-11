import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/plans', async (req, res) => {
    try {
        let queryText;
        let queryParams;

        if (req.user.role === 'parent') {
            queryText = `
        SELECT iep.*, s.full_name as student_name
        FROM iep_plans iep
        JOIN students s ON iep.student_id = s.id
        WHERE s.parent_id = $1
        ORDER BY iep.created_at DESC
      `;
            queryParams = [req.user.id];
        } else if (req.user.role === 'therapist') {
            queryText = `
        SELECT iep.*, s.full_name as student_name
        FROM iep_plans iep
        JOIN students s ON iep.student_id = s.id
        WHERE iep.created_by = $1 OR s.primary_therapist_id = $1
        ORDER BY iep.created_at DESC
      `;
            queryParams = [req.user.id];
        } else {
            queryText = `
        SELECT iep.*, s.full_name as student_name
        FROM iep_plans iep
        JOIN students s ON iep.student_id = s.id
        ORDER BY iep.created_at DESC
      `;
            queryParams = [];
        }

        const result = await query(queryText, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching IEP plans:', error);
        res.status(500).json({ error: 'Failed to fetch IEP plans' });
    }
});

router.get('/plans/:id', param('id').isUUID(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const result = await query(
            `SELECT iep.*, s.full_name as student_name
       FROM iep_plans iep
       JOIN students s ON iep.student_id = s.id
       WHERE iep.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'IEP plan not found' });
        }

        const iepPlan = result.rows[0];

        const hasAccess =
            req.user.role === 'system_admin' ||
            req.user.role === 'school_admin' ||
            iepPlan.created_by === req.user.id;

        if (!hasAccess) {
            const studentAccess = await query(
                'SELECT 1 FROM students WHERE id = $1 AND (parent_id = $2 OR primary_therapist_id = $2)',
                [iepPlan.student_id, req.user.id]
            );
            if (studentAccess.rows.length === 0) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
        }

        res.json(iepPlan);
    } catch (error) {
        console.error('Error fetching IEP plan:', error);
        res.status(500).json({ error: 'Failed to fetch IEP plan' });
    }
});

router.post(
    '/plans',
    authorize('therapist', 'school_admin', 'system_admin'),
    [
        body('studentId').isUUID(),
        body('startDate').isISO8601(),
        body('endDate').isISO8601(),
        body('goals').isArray().notEmpty(),
        body('accommodations').optional().isArray(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { studentId, startDate, endDate, goals, accommodations } = req.body;

        try {
            const hasAccess = await query(
                `SELECT 1 FROM students WHERE id = $1 AND primary_therapist_id = $2`,
                [studentId, req.user.id]
            );

            if (hasAccess.rows.length === 0 && req.user.role !== 'system_admin') {
                return res.status(403).json({ error: 'Unauthorized to create IEP for this student' });
            }

            const result = await query(
                `INSERT INTO iep_plans (student_id, created_by, start_date, end_date, goals, accommodations, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [studentId, req.user.id, startDate, endDate, JSON.stringify(goals), JSON.stringify(accommodations || []), 'active']
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating IEP plan:', error);
            res.status(500).json({ error: 'Failed to create IEP plan' });
        }
    }
);

router.put(
    '/plans/:id',
    param('id').isUUID(),
    authorize('therapist', 'school_admin', 'system_admin'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { startDate, endDate, goals, accommodations, status } = req.body;

        try {
            const existing = await query(
                'SELECT * FROM iep_plans WHERE id = $1',
                [req.params.id]
            );

            if (existing.rows.length === 0) {
                return res.status(404).json({ error: 'IEP plan not found' });
            }

            if (existing.rows[0].created_by !== req.user.id && req.user.role !== 'system_admin') {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            const result = await query(
                `UPDATE iep_plans
         SET start_date = COALESCE($1, start_date),
             end_date = COALESCE($2, end_date),
             goals = COALESCE($3, goals),
             accommodations = COALESCE($4, accommodations),
             status = COALESCE($5, status),
             updated_at = now()
         WHERE id = $6 RETURNING *`,
                [
                    startDate,
                    endDate,
                    goals ? JSON.stringify(goals) : null,
                    accommodations ? JSON.stringify(accommodations) : null,
                    status,
                    req.params.id
                ]
            );

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating IEP plan:', error);
            res.status(500).json({ error: 'Failed to update IEP plan' });
        }
    }
);

router.delete(
    '/plans/:id',
    param('id').isUUID(),
    authorize('therapist', 'school_admin', 'system_admin'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const existing = await query(
                'SELECT * FROM iep_plans WHERE id = $1',
                [req.params.id]
            );

            if (existing.rows.length === 0) {
                return res.status(404).json({ error: 'IEP plan not found' });
            }

            if (existing.rows[0].created_by !== req.user.id && req.user.role !== 'system_admin') {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            await query('DELETE FROM iep_plans WHERE id = $1', [req.params.id]);

            res.json({ message: 'IEP plan deleted successfully' });
        } catch (error) {
            console.error('Error deleting IEP plan:', error);
            res.status(500).json({ error: 'Failed to delete IEP plan' });
        }
    }
);

export default router;
