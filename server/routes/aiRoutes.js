// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

/**
 * POST /api/ai/generate-exam
 * Tạo đề thi với AI
 */
router.post('/generate-exam', async (req, res) => {
    try {
        const {
            subject,
            topic,
            numQuestions,
            difficulty,
            questionTypes,
            additionalRequirements
        } = req.body;

        // Validate input
        if (!subject || !topic || !numQuestions || !difficulty || !questionTypes) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: subject, topic, numQuestions, difficulty, questionTypes'
            });
        }

        if (!Array.isArray(questionTypes) || questionTypes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'questionTypes must be a non-empty array'
            });
        }

        // Validate số lượng câu hỏi
        const num = parseInt(numQuestions);
        if (isNaN(num) || num < 1 || num > 30) {
            return res.status(400).json({
                success: false,
                message: 'numQuestions must be between 1 and 30'
            });
        }

        // Validate difficulty
        const validDifficulties = ['easy', 'medium', 'hard', 'mixed'];
        if (!validDifficulties.includes(difficulty.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid difficulty. Must be: easy, medium, hard, or mixed'
            });
        }

        // Validate question types
        const validTypes = ['SingleChoice', 'MultipleChoice', 'FillInBlank', 'Essay'];
        const invalidTypes = questionTypes.filter(type => !validTypes.includes(type));
        if (invalidTypes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid question types: ${invalidTypes.join(', ')}`
            });
        }

        console.log('Received exam generation request:', {
            subject,
            topic,
            numQuestions: num,
            difficulty,
            questionTypes
        });

        // Gọi Gemini service
        const result = await geminiService.generateExam({
            subject,
            topic,
            numQuestions: num,
            difficulty,
            questionTypes,
            additionalRequirements: additionalRequirements || ''
        });

        // Trả về kết quả
        res.json({
            success: true,
            questions: result.questions,
            metadata: result.metadata
        });

    } catch (error) {
        console.error('Error in /api/ai/generate-exam:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate exam with AI',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/ai/test
 * Test kết nối với Gemini API
 */
router.get('/test', async (req, res) => {
    try {
        const result = await geminiService.testConnection();
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Gemini API connection successful',
                response: result.response
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Gemini API connection failed',
                error: result.message
            });
        }
    } catch (error) {
        console.error('Error testing Gemini connection:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing connection',
            error: error.message
        });
    }
});

/**
 * POST /api/ai/regenerate-question
 * Tạo lại một câu hỏi cụ thể
 */
router.post('/regenerate-question', async (req, res) => {
    try {
        const { subject, topic, difficulty, type } = req.body;

        if (!subject || !topic || !difficulty || !type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Tạo một câu hỏi mới
        const result = await geminiService.generateExam({
            subject,
            topic,
            numQuestions: 1,
            difficulty,
            questionTypes: [type],
            additionalRequirements: ''
        });

        res.json({
            success: true,
            question: result.questions[0]
        });

    } catch (error) {
        console.error('Error regenerating question:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;