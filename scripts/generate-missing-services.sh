#!/bin/bash
# 生成有controller无service的模块的service骨架
# 凌晨3点批量补全后端120模块service

cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules

for m in audit brand-custom cashier chaos content db-knowledge device-adapter devops docs image-recognition inventory license locale logistics member open-api rbac retrieval rls saas-advanced saas-billing scout svip venue voice-processing; do
  dir="./$m"
  svc_file="$dir/$m.service.ts"
  svc_test_file="$dir/$m.service.test.ts"
  
  # 模板方式获取模块名
  mod_name=$(echo "$m" | awk -F- '{for(i=1;i<=NF;i++) printf "%s", toupper(substr($i,1,1)) substr($i,2)}')
  
  if [ -f "$svc_file" ]; then
    echo "跳过已有: $svc_file"
    continue
  fi

  echo "生成: $m ($mod_name)"
  
  cat > "$svc_file" << SVCEOF
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${mod_name}Entity } from './$m.entity';

@Injectable()
export class ${mod_name}Service {
  constructor(
    @InjectRepository(${mod_name}Entity)
    private readonly repo: Repository<${mod_name}Entity>,
  ) {}

  async findAll(): Promise<${mod_name}Entity[]> {
    return this.repo.find();
  }

  async findById(id: string): Promise<${mod_name}Entity | null> {
    return this.repo.findOneBy({ id } as any);
  }

  async create(data: Partial<${mod_name}Entity>): Promise<${mod_name}Entity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<${mod_name}Entity>): Promise<${mod_name}Entity | null> {
    await this.repo.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
SVCEOF

  # 同时生成测试文件
  if [ ! -f "$svc_test_file" ]; then
    cat > "$svc_test_file" << TESTEOF
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ${mod_name}Service } from './$m.service';
import { ${mod_name}Entity } from './$m.entity';

describe('${mod_name}Service', () => {
  let service: ${mod_name}Service;
  let mockRepo: any;

  const mockEntity = { id: 'test-1', name: 'Test' } as any;

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn().mockResolvedValue([mockEntity]),
      findOneBy: jest.fn().mockResolvedValue(mockEntity),
      create: jest.fn().mockReturnValue(mockEntity),
      save: jest.fn().mockResolvedValue(mockEntity),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${mod_name}Service,
        { provide: getRepositoryToken(${mod_name}Entity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<${mod_name}Service>(${mod_name}Service);
  });

  it('should findAll', async () => {
    const result = await service.findAll();
    expect(result).toEqual([mockEntity]);
    expect(mockRepo.find).toHaveBeenCalled();
  });

  it('should findById', async () => {
    const result = await service.findById('test-1');
    expect(result).toEqual(mockEntity);
    expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: 'test-1' });
  });

  it('should create', async () => {
    const result = await service.create({ name: 'Test' });
    expect(result).toEqual(mockEntity);
    expect(mockRepo.create).toHaveBeenCalledWith({ name: 'Test' });
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should update', async () => {
    const result = await service.update('test-1', { name: 'Updated' });
    expect(result).toEqual(mockEntity);
    expect(mockRepo.update).toHaveBeenCalledWith('test-1', { name: 'Updated' });
  });

  it('should delete and return true', async () => {
    const result = await service.delete('test-1');
    expect(result).toBe(true);
    expect(mockRepo.delete).toHaveBeenCalledWith('test-1');
  });

  it('should return null when findById not found', async () => {
    mockRepo.findOneBy.mockResolvedValue(null);
    const result = await service.findById('nonexistent');
    expect(result).toBeNull();
  });
});
TESTEOF
    echo "  测试: $svc_test_file"
  fi
done

echo ""
echo "=== 完成 ==="
