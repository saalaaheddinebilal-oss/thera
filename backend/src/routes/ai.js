import express from 'express';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.post(
  '/analyze-speech',
  authorize('therapist', 'school_admin', 'system_admin'),
  [
    body('studentId').isUUID(),
    body('audioData').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, audioData, sessionId } = req.body;

    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/speech/analyze`, {
        audio_data: audioData,
        student_id: studentId,
      });

      const result = await query(
        `INSERT INTO ai_analysis_results (student_id, session_id, analysis_type, input_data, results, confidence_score)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          studentId,
          sessionId || null,
          'speech',
          { audioData: 'reference' },
          aiResponse.data,
          aiResponse.data.confidence,
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error analyzing speech:', error);
      res.status(500).json({ error: 'Failed to analyze speech' });
    }
  }
);

router.post(
  '/analyze-behavior',
  authorize('therapist', 'school_admin', 'system_admin'),
  [
    body('studentId').isUUID(),
    body('videoData').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, videoData, sessionId } = req.body;

    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/behavior/analyze`, {
        video_data: videoData,
        student_id: studentId,
      });

      const result = await query(
        `INSERT INTO ai_analysis_results (student_id, session_id, analysis_type, input_data, results, confidence_score)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          studentId,
          sessionId || null,
          'behavior',
          { videoData: 'reference' },
          aiResponse.data,
          aiResponse.data.confidence,
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error analyzing behavior:', error);
      res.status(500).json({ error: 'Failed to analyze behavior' });
    }
  }
);

router.post(
  '/detect-emotion',
  authorize('therapist', 'school_admin', 'system_admin'),
  [
    body('studentId').isUUID(),
    body('imageData').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, imageData, sessionId } = req.body;

    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/emotion/detect`, {
        image_data: imageData,
        student_id: studentId,
      });

      const result = await query(
        `INSERT INTO ai_analysis_results (student_id, session_id, analysis_type, input_data, results, confidence_score)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          studentId,
          sessionId || null,
          'emotion',
          { imageData: 'reference' },
          aiResponse.data,
          aiResponse.data.confidence,
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error detecting emotion:', error);
      res.status(500).json({ error: 'Failed to detect emotion' });
    }
  }
);

router.post(
  '/predict-progress',
  authorize('therapist', 'school_admin', 'system_admin'),
  [body('studentId').isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId } = req.body;

    try {
      const progressData = await query(
        'SELECT * FROM progress_tracking WHERE student_id = $1 ORDER BY tracking_date DESC LIMIT 100',
        [studentId]
      );

      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/progress/predict`, {
        student_id: studentId,
        progress_data: progressData.rows,
      });

      const result = await query(
        `INSERT INTO ai_analysis_results (student_id, analysis_type, results, confidence_score)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [studentId, 'progress_prediction', aiResponse.data, aiResponse.data.confidence]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error predicting progress:', error);
      res.status(500).json({ error: 'Failed to predict progress' });
    }
  }
);

router.post(
  '/generate-iep',
  authorize('therapist', 'school_admin', 'system_admin'),
  [body('studentId').isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId } = req.body;

    try {
      const studentData = await query(
        `SELECT s.*,
                json_agg(DISTINCT sc.*) as conditions,
                json_agg(DISTINCT a.*) as assessments
         FROM students s
         LEFT JOIN student_conditions sc ON s.id = sc.student_id
         LEFT JOIN assessments a ON s.id = a.student_id
         WHERE s.id = $1
         GROUP BY s.id`,
        [studentId]
      );

      if (studentData.rows.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/iep/generate`, {
        student_data: studentData.rows[0],
      });

      res.json(aiResponse.data);
    } catch (error) {
      console.error('Error generating IEP:', error);
      res.status(500).json({ error: 'Failed to generate IEP' });
    }
  }
);

router.get('/results/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const hasAccess = await query(
      `SELECT 1 FROM students WHERE id = $1 AND (parent_id = $2 OR primary_therapist_id = $2)`,
      [studentId, req.user.id]
    );

    if (hasAccess.rows.length === 0 && req.user.role !== 'system_admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      'SELECT * FROM ai_analysis_results WHERE student_id = $1 ORDER BY analysis_date DESC',
      [studentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching AI results:', error);
    res.status(500).json({ error: 'Failed to fetch AI results' });
  }
});

export default router;
