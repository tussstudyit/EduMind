import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GeneratedQuestionDraft } from '../ai-engine/ai-engine.service';
import { UserEntity } from '../users/user.entity';
import { AssessmentsService } from './assessments.service';
import { SaveQuizDto } from './dto/save-quiz.dto';
import { SaveQuestionDto } from './dto/save-question.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Get('quizzes')
  listQuizzes(@CurrentUser() user: UserEntity, @Query('courseId') courseId?: string) {
    return this.assessments.listQuizzes(user, courseId);
  }

  @Get('quizzes/:id')
  getQuiz(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.assessments.getQuizForUser(user, id);
  }

  @Post('quizzes')
  @Roles('admin', 'teacher')
  createQuiz(@CurrentUser() user: UserEntity, @Body() body: SaveQuizDto) {
    return this.assessments.createQuiz(user, body);
  }

  @Post('quizzes/ai-generate')
  @Roles('admin', 'teacher')
  generateWithAi(
    @CurrentUser() user: UserEntity,
    @Body()
    body: {
      topic: string;
      sourceText?: string;
      questionCount?: number;
      difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
      questionType?: 'multiple_choice' | 'essay' | 'mixed';
      courseId?: string;
    },
  ) {
    return this.assessments.generateQuestionsWithAi(user, body);
  }

  @Post('questions/ai-rewrite')
  @Roles('admin', 'teacher')
  rewriteWithAi(
    @CurrentUser() user: UserEntity,
    @Body()
    body: {
      questions?: GeneratedQuestionDraft[];
      rawText?: string;
      mode?: 'improve' | 'add_explanation' | 'harder' | 'unstructured_to_quiz';
      instruction?: string;
    },
  ) {
    return this.assessments.rewriteQuestionsWithAi(user, body);
  }

  @Patch('quizzes/:id')
  @Roles('admin', 'teacher')
  updateQuiz(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() body: SaveQuizDto) {
    return this.assessments.updateQuiz(user, id, body);
  }

  @Delete('quizzes/:id')
  @Roles('admin', 'teacher')
  removeQuiz(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.assessments.removeQuiz(user, id);
  }

  @Get('quizzes/:id/questions')
  listQuestions(@CurrentUser() user: UserEntity, @Param('id') id: string, @Query('viewAs') viewAs?: string) {
    return this.assessments.listQuestions(user, id, viewAs === 'student');
  }

  @Post('questions')
  @Roles('admin', 'teacher')
  createQuestion(@CurrentUser() user: UserEntity, @Body() body: SaveQuestionDto) {
    return this.assessments.createQuestion(user, body);
  }

  @Patch('questions/:id')
  @Roles('admin', 'teacher')
  updateQuestion(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() body: SaveQuestionDto) {
    return this.assessments.updateQuestion(user, id, body);
  }

  @Delete('questions/:id')
  @Roles('admin', 'teacher')
  removeQuestion(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.assessments.removeQuestion(user, id);
  }
}
