/**
 * employees-data — ToB employee management mock data
 */

export type EmployeeRole = 'manager' | 'supervisor' | 'staff' | 'trainee';
export type EmployeeStatus = 'active' | 'inactive' | 'suspended' | 'resigned';
export type EmployeeDepartment = 'sales' | 'operations' | 'marketing' | 'finance' | 'hr';

export interface EmployeeItem {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  department: EmployeeDepartment;
  role: EmployeeRole;
  status: EmployeeStatus;
  storeName: string;
  marketCode: string;
  joinDate: string;
  salary: number;
  performance: number; // 0-100 score
  lastActive: string;
  tags: string[];
}

export const EMPLOYEE_ROLE_MAP: Record<EmployeeRole, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
  manager: { label: '经理', variant: 'info' },
  supervisor: { label: '主管', variant: 'warning' },
  staff: { label: '员工', variant: 'success' },
  trainee: { label: '实习生', variant: 'neutral' },
};

export const EMPLOYEE_STATUS_MAP: Record<EmployeeStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  active: { label: '在职', variant: 'success' },
  inactive: { label: '休假', variant: 'warning' },
  suspended: { label: '停职', variant: 'danger' },
  resigned: { label: '离职', variant: 'neutral' },
};

export const EMPLOYEE_ROLES: EmployeeRole[] = ['manager', 'supervisor', 'staff', 'trainee'];
export const EMPLOYEE_STATUSES: EmployeeStatus[] = ['active', 'inactive', 'suspended', 'resigned'];
export const EMPLOYEE_DEPARTMENTS: EmployeeDepartment[] = ['sales', 'operations', 'marketing', 'finance', 'hr'];

export const ALL_STORES = ['旗舰店(上海)', '旗舰店(北京)', '标准店(深圳)', '标准店(成都)', '体验店(杭州)'];
export const ALL_MARKETS = ['CN-SH', 'CN-BJ', 'CN-GD', 'CN-SC', 'CN-ZJ'];

const FIRST_NAMES = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '林', '何'];
const LAST_NAMES = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超'];

export function createMockEmployees(count = 50): EmployeeItem[] {
  const now = new Date('2026-06-24');
  const employees: EmployeeItem[] = [];

  for (let i = 1; i <= count; i++) {
    const role: EmployeeRole = EMPLOYEE_ROLES[Math.floor(Math.random() * EMPLOYEE_ROLES.length)]!;
    const statusWeights: EmployeeStatus[] = [
      'active', 'active', 'active',
      'inactive', 'inactive',
      'suspended',
      'resigned',
    ];
    const status: EmployeeStatus = statusWeights[Math.floor(Math.random() * statusWeights.length)]!;
    const department: EmployeeDepartment = EMPLOYEE_DEPARTMENTS[Math.floor(Math.random() * EMPLOYEE_DEPARTMENTS.length)]!;
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]!;
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]!;
    const joinDays = Math.floor(Math.random() * 730) + 30;
    const lastActiveDays = status === 'active' ? Math.floor(Math.random() * 7) : Math.floor(Math.random() * 60) + 1;

    const roleSalaryMap: Record<EmployeeRole, [number, number]> = {
      manager: [15000, 30000],
      supervisor: [8000, 14999],
      staff: [5000, 7999],
      trainee: [3000, 4999],
    };
    const [salaryMin, salaryMax] = roleSalaryMap[role];
    const salary = Math.floor(Math.random() * (salaryMax - salaryMin) + salaryMin);

    const performance = Math.floor(status === 'active' ? 40 + Math.random() * 60 : 10 + Math.random() * 50);

    const tagPool = ['优秀员工', '销售冠军', '新入职', '需培训', '全勤奖', '导师', '储备干部', '远程办公'];
    const tagCount = Math.floor(Math.random() * 3);
    const tags = [...tagPool].sort(() => Math.random() - 0.5).slice(0, tagCount);

    employees.push({
      id: `emp-${String(i).padStart(4, '0')}`,
      code: `E${String(now.getFullYear()).slice(2)}${String(i).padStart(6, '0')}`,
      name: `${firstName}${lastName}`,
      phone: `1${(['38', '39', '50', '86', '35', '52'] as const)[Math.floor(Math.random() * 6)]!}${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      email: `employee${i}@company.com`,
      department,
      role,
      status,
      storeName: ALL_STORES[Math.floor(Math.random() * ALL_STORES.length)]!,
      marketCode: ALL_MARKETS[Math.floor(Math.random() * ALL_MARKETS.length)]!,
      joinDate: new Date(now.getTime() - joinDays * 86400000).toISOString().slice(0, 10),
      salary,
      performance,
      lastActive: new Date(now.getTime() - lastActiveDays * 86400000).toISOString().slice(0, 10),
      tags,
    });
  }

  // Sort by join date descending
  employees.sort((a, b) => b.joinDate.localeCompare(a.joinDate));
  return employees;
}

export const MOCK_EMPLOYEES = createMockEmployees(50);
