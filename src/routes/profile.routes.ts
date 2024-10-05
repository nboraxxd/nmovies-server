import { Router } from 'express'

import { uploadAvatar } from '@/utils/multer'
import { wrapRequestHandler } from '@/utils/handlers'
import { fileValidator, zodValidator } from '@/middlewares/validators.middleware'
import { getProfileController, uploadAvatarController } from '@/controllers/profile.controllers'
import { avatarSchema } from '@/schemas/files.schema'

const profileRouter = Router()

/**
 * @swagger
 * /profile:
 *  get:
 *   tags:
 *   - profile
 *   summary: Get profile
 *   description: Get user profile by token
 *   operationId: get-profile
 *   security:
 *    - bearerAuth: []
 *   responses:
 *    '200':
 *     description: Get profile successful
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         message:
 *          type: string
 *          example: Get profile successful
 *         data:
 *          $ref: '#/components/schemas/userSchema'
 *    '401':
 *     description: Unauthorized
 *    '404':
 *     description: User not found
 */
profileRouter.get('/', wrapRequestHandler(getProfileController))

profileRouter.post(
  '/upload-avatar',
  fileValidator(uploadAvatar),
  zodValidator({ schema: avatarSchema, customPath: 'avatar', location: 'file' }),
  wrapRequestHandler(uploadAvatarController)
)

export default profileRouter
