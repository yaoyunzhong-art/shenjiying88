import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateContentDto } from './content.dto';

async function main() {
  const dto = plainToInstance(CreateContentDto, {
    title: '测试内容',
    slug: 'test-content',
    summary: '这是一个测试',
    body: '完整内容正文...',
    category: 'notice',
    authorId: 'user_001',
    coverImageUrl: 'https://example.com/cover.jpg',
    metadata: { tags: ['test'], version: 1 },
  });

  const errors = await validate(dto);
  console.log('Errors:', JSON.stringify(errors, null, 2));
  console.log('Error count:', errors.length);
}

main().catch(console.error);
