import cors from 'cors'
import express from 'express'
import swaggerUi from 'swagger-ui-express'

import { initFolder } from '@/utils/files'
import { openapiSpecification } from '@/utils/swagger'
import envVariables from '@/schemas/env-variables.schema'
import databaseService from '@/services/database.services'
import { authorizationValidator } from '@/middlewares/validators.middleware'
import { defaultErrorHandler } from '@/middlewares/default-error.middleware'
import authRouter from '@/routes/auth.routes'
import tmdbRouter from '@/routes/tmdb.routes'
import profileRouter from '@/routes/profile.routes'
import favoritesRouter from '@/routes/favorites.routes'

const app = express()
const port = envVariables.PORT

// kết nối với database
databaseService.connect()

// Quy định CORS
app.use(cors({ origin: '*' }))

// tạo folder uploads
initFolder()

// parse json của client gởi lên, chuyển thành dạnh object để xử lý
app.use(express.json())

app.use('/api', swaggerUi.serve, swaggerUi.setup(openapiSpecification))

app.use('/auth', authRouter)

app.use('/profile', authorizationValidator({ isLoginRequired: true }), profileRouter)

app.use('/tmdb', authorizationValidator({ isLoginRequired: false }), tmdbRouter)

app.use('/favorites', favoritesRouter)

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})
