import { Router } from 'express';
import {
  authMiddleware,
  roleCheckMiddleware,
} from '@middleware/auth.middleware';
import { commonFilesModel } from '@models/common-files/common-files.model';
import { UUID } from '@CustomTypes/common.types';
import { NotFoundError } from '@utils/errors';

const router = Router();

// ==================== EXERCISE COMMON FILES ====================

router.get(
  '/exercise/:exerciseId',
  authMiddleware,
  roleCheckMiddleware(['teacher', 'admin']),
  async (req, res, next) => {
    try {
      const { exerciseId } = req.params;
      const files = await commonFilesModel.getExerciseFiles(exerciseId as UUID);
      res.json(files);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/exercise/:exerciseId',
  authMiddleware,
  roleCheckMiddleware(['teacher', 'admin']),
  async (req, res, next) => {
    try {
      const { exerciseId } = req.params;
      const { filename, content, fileType, description } = req.body;

      if (!filename || !content) {
        res.status(400).json({ error: 'filename and content are required' });
        return;
      }

      const file = await commonFilesModel.createExerciseFile(
        exerciseId as UUID,
        {
          filename,
          content,
          fileType,
          description,
        }
      );
      res.status(201).json(file);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/exercise/file/:fileId',
  authMiddleware,
  roleCheckMiddleware(['teacher', 'admin']),
  async (req, res, next) => {
    try {
      const { fileId } = req.params;
      const { filename, content, fileType, description } = req.body;

      const file = await commonFilesModel.updateExerciseFile(fileId as UUID, {
        filename,
        content,
        fileType,
        description,
      });

      if (!file) {
        throw new NotFoundError('Common file not found');
      }

      res.json(file);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/exercise/file/:fileId',
  authMiddleware,
  roleCheckMiddleware(['teacher', 'admin']),
  async (req, res, next) => {
    try {
      const { fileId } = req.params;
      const deleted = await commonFilesModel.deleteExerciseFile(fileId as UUID);

      if (!deleted) {
        throw new NotFoundError('Common file not found');
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// ==================== SYLLABUS COMMON FILES ====================

router.get(
  '/syllabus/:syllabusId',
  authMiddleware,
  roleCheckMiddleware(['teacher', 'admin']),
  async (req, res, next) => {
    try {
      const { syllabusId } = req.params;
      const files = await commonFilesModel.getSyllabusFiles(syllabusId as UUID);
      res.json(files);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/syllabus/:syllabusId',
  authMiddleware,
  roleCheckMiddleware(['teacher', 'admin']),
  async (req, res, next) => {
    try {
      const { syllabusId } = req.params;
      const { filename, content, fileType, description } = req.body;

      if (!filename || !content) {
        res.status(400).json({ error: 'filename and content are required' });
        return;
      }

      const file = await commonFilesModel.createSyllabusFile(
        syllabusId as UUID,
        {
          filename,
          content,
          fileType,
          description,
        }
      );
      res.status(201).json(file);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/syllabus/file/:fileId',
  authMiddleware,
  roleCheckMiddleware(['teacher', 'admin']),
  async (req, res, next) => {
    try {
      const { fileId } = req.params;
      const { filename, content, fileType, description } = req.body;

      const file = await commonFilesModel.updateSyllabusFile(fileId as UUID, {
        filename,
        content,
        fileType,
        description,
      });

      if (!file) {
        throw new NotFoundError('Common file not found');
      }

      res.json(file);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/syllabus/file/:fileId',
  authMiddleware,
  roleCheckMiddleware(['teacher', 'admin']),
  async (req, res, next) => {
    try {
      const { fileId } = req.params;
      const deleted = await commonFilesModel.deleteSyllabusFile(fileId as UUID);

      if (!deleted) {
        throw new NotFoundError('Common file not found');
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
