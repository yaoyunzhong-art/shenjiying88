import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common'
import { TrainingService } from './training.service'
import {
  CreateCourseDto,
  EnrollDto,
  UpdateProgressDto,
  StartQuizDto,
  SubmitQuizDto,
  GenerateCertificateDto
} from './training.dto'
import type { Course, Enrollment, QuizAttempt, UserStats } from './training.entity'
import { TenantGuard } from '../agent/tenant.guard';

@Controller('training')
@UseGuards(TenantGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  /** POST /training/courses — 创建课程 */
  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto): Course {
    return this.trainingService.createCourse(dto)
  }

  /** GET /training/courses — 获取所有课程 */
  @Get('courses')
  listCourses(): Course[] {
    return this.trainingService.listCourses()
  }

  /** GET /training/courses/:id — 获取课程详情 */
  @Get('courses/:id')
  getCourse(@Param('id') id: string): Course {
    const course = this.trainingService.getCourse(id)
    if (!course) throw new NotFoundException(`Course ${id} not found`)
    return course
  }

  /** GET /training/courses/by-role/:role — 按角色获取课程 */
  @Get('courses/by-role/:role')
  getCoursesByRole(@Param('role') role: string): Course[] {
    return this.trainingService.getCoursesByRole(role)
  }

  /** POST /training/enroll — 学员报名课程 */
  @Post('enroll')
  enroll(@Body() dto: EnrollDto): Enrollment {
    return this.trainingService.enroll(dto.userId, dto.courseId)
  }

  /** POST /training/progress — 更新学习进度 */
  @Post('progress')
  updateProgress(@Body() dto: UpdateProgressDto): { status: string; progress: number } {
    this.trainingService.updateProgress(dto.userId, dto.courseId, dto.moduleId)
    const enrollment = this.trainingService.getEnrollment(dto.userId, dto.courseId)
    if (!enrollment) throw new NotFoundException('Enrollment not found')
    return { status: enrollment.status, progress: enrollment.progress }
  }

  /** GET /training/enrollment — 获取报名记录 */
  @Get('enrollment')
  getEnrollment(
    @Query('userId') userId: string,
    @Query('courseId') courseId: string
  ): Enrollment {
    const enrollment = this.trainingService.getEnrollment(userId, courseId)
    if (!enrollment) throw new NotFoundException('Enrollment not found')
    return enrollment
  }

  /** POST /training/quiz/start — 开始测验 */
  @Post('quiz/start')
  startQuiz(@Body() dto: StartQuizDto): QuizAttempt {
    return this.trainingService.startQuiz(dto.userId, dto.courseId)
  }

  /** POST /training/quiz/submit — 提交测验答案 */
  @Post('quiz/submit')
  submitQuiz(@Body() dto: SubmitQuizDto): QuizAttempt & { passed: boolean; score: number } {
    const result = this.trainingService.submitQuiz(dto.attemptId, dto.answers)
    if (!result) throw new BadRequestException('Quiz attempt not found')
    return result
  }

  /** GET /training/quiz/attempts — 获取测验历史 */
  @Get('quiz/attempts')
  getQuizAttempts(
    @Query('userId') userId: string,
    @Query('courseId') courseId: string
  ): QuizAttempt[] {
    return this.trainingService.getQuizAttempts(userId, courseId)
  }

  /** POST /training/certificate — 生成证书 */
  @Post('certificate')
  generateCertificate(@Body() dto: GenerateCertificateDto): { certificateId: string } {
    const certificateId = this.trainingService.issueCertificate(dto.userId, dto.courseId)
    return { certificateId }
  }

  /** GET /training/certificate/:id — 获取证书详情 */
  @Get('certificate/:id')
  getCertificate(@Param('id') id: string): { valid: boolean; userId?: string; courseId?: string; issuedAt?: Date } {
    const cert = this.trainingService.verifyCertificate(id)
    if (!cert.valid) throw new NotFoundException(`Certificate ${id} not found`)
    return cert
  }

  /** GET /training/recommendations — 获取推荐课程 */
  @Get('recommendations')
  getRecommendations(@Query('role') role: string): Array<{ courseId: string; order: number; reason: string }> {
    return this.trainingService.recommendPath('user-unknown', role)
  }

  /** GET /training/stats/:userId — 获取学员统计 */
  @Get('stats/:userId')
  getUserStats(@Param('userId') userId: string): UserStats {
    return this.trainingService.getUserStats(userId)
  }

  /** GET /training/completion-rate/:courseId — 获取课程完成率 */
  @Get('completion-rate/:courseId')
  getCompletionRate(@Param('courseId') courseId: string): { courseId: string; completionRate: number } {
    const rate = this.trainingService.getCourseCompletionRate(courseId)
    return { courseId, completionRate: rate }
  }
}
