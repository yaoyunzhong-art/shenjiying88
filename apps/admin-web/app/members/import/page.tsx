'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  DataTable,
  FormField,
  FormSubmitFeedback,
  PageShell,
  Pagination,
  SearchFilterInput,
  SubmitButton,
  StatusBadge,
  WorkspaceBreadcrumb,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import {
  MEMBER_TIER_MAP,
  MEMBER_STATUSES,
  MEMBER_STATUS_MAP,
  type MemberTier,
  type MemberStatus,
} from '../../members-data';

// ---- 导入数据类型 ----

type ImportStage = 'upload' | 'preview' | 'confirming' | 'result';

interface ImportRecord {
  row: number;
  name: string;
  phone: string;
  email: string;
  tier: string;
  storeName: string;
  marketCode: string;
  notes: string;
  validationErrors: string[];
  isValid: boolean;
}

interface ImportColumnMapping {
  name: string;
  phone: string;
  email: string;
  tier: string;
  storeName: string;
  marketCode: string;
  notes: string;
}

interface ImportProgress {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

interface ImportConfig {
  duplicateCheck: 'phone' | 'name' | 'none';
  defaultTier: MemberTier;
  defaultStatus: MemberStatus;
  defaultMarket: string;
  sendWelcomeMessage: boolean;
}

const DEFAULT_IMPORT_CONFIG: ImportConfig = {
  duplicateCheck: 'phone',
  defaultTier: 'standard',
  defaultStatus: 'active',
  defaultMarket: 'cn-mainland',
  sendWelcomeMessage: false,
};

const MARKET_OPTIONS = [
  { value: 'cn-mainland', label: '中国大陆' },
  { value: 'us-default', label: '美国' },
  { value: 'uk-default', label: '英国' },
  { value: 'jp-default', label: '日本' },
  { value: 'kr-default', label: '韩国' },
  { value: 'de-default', label: '德国' },
];

// 模拟列映射
const CSV_HEADERS = ['姓名', '手机号', '邮箱', '等级', '门店', '市场', '备注'];

// ---- 导入状态标签 ----

function statusLabel(isValid: boolean): string {
  return isValid ? '通过校验' : '校验失败';
}

function statusColor(isValid: boolean): string {
  return isValid ? '#86efac' : '#fca5a5';
}

// ---- 页面组件 ----

export default function ImportMemberPage() {
  const router = useRouter();

  const [stage, setStage] = useState<ImportStage>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportRecord[]>([]);
  const [importConfig, setImportConfig] = useState<ImportConfig>(DEFAULT_IMPORT_CONFIG);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  // 搜索筛选
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    previewData,
    ['name', 'phone', 'storeName'] as (keyof ImportRecord)[]
  );

  // 分页
  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  });

  const sortedItems = useSortedItems(filteredItems, previewColumns, sortConfig);
  const pageItems = pagination.paginate(sortedItems);

  // 表格列定义
  const columns: DataTableColumn<ImportRecord>[] = useMemo(
    () => [
      {
        key: 'row',
        title: '行号',
        dataKey: 'row',
        width: 60,
        align: 'center',
      },
      {
        key: 'name',
        title: '姓名',
        dataKey: 'name',
        sortable: true,
        render: (item) => (
          <span style={{ color: item.validationErrors.length > 0 ? '#fca5a5' : '#e2e8f0' }}>
            {item.name}
          </span>
        ),
      },
      {
        key: 'phone',
        title: '手机号',
        dataKey: 'phone',
        sortable: true,
      },
      {
        key: 'email',
        title: '邮箱',
        dataKey: 'email',
      },
      {
        key: 'tier',
        title: '等级',
        sortable: true,
        render: (item) => {
          const tierInfo = MEMBER_TIER_MAP[item.tier as MemberTier];
          if (!tierInfo && item.tier) {
            return <span style={{ color: '#fca5a5' }}>{item.tier}</span>;
          }
          return tierInfo ? (
            <StatusBadge label={tierInfo.label} variant={tierInfo.variant} size="sm" dot />
          ) : (
            <span style={{ color: '#94a3b8' }}>—</span>
          );
        },
      },
      {
        key: 'storeName',
        title: '所属门店',
        dataKey: 'storeName',
        sortable: true,
      },
      {
        key: 'validationErrors',
        title: '校验',
        render: (item) => {
          const valid = item.validationErrors.length === 0;
          return (
            <span
              style={{
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 999,
                background: valid ? 'rgba(74, 222, 128, 0.12)' : 'rgba(248, 113, 113, 0.16)',
                color: statusColor(valid),
                whiteSpace: 'nowrap',
              }}
            >
              {statusLabel(valid)}
            </span>
          );
        },
      },
    ],
    []
  );

  // 文件选择
  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
        return;
      }
    }
  }, []);

  // 模拟文件解析和校验
  const handleParseFile = useCallback(async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    // 模拟解析延迟
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 模拟预览数据
    const mockRecords: ImportRecord[] = [
      { row: 1, name: '张三', phone: '13800001111', email: 'zhangsan@example.com', tier: 'gold', storeName: '朝阳大悦城旗舰店', marketCode: 'cn-mainland', notes: '新入职员工推荐', validationErrors: [], isValid: true },
      { row: 2, name: '李四', phone: '13900002222', email: 'lisi@example.com', tier: 'silver', storeName: '上海陆家嘴中心店', marketCode: 'cn-mainland', notes: '', validationErrors: [], isValid: true },
      { row: 3, name: '王五', phone: '13700003333', email: '', tier: 'standard', storeName: '深圳万象天地店', marketCode: 'cn-mainland', notes: '批发客户', validationErrors: [], isValid: true },
      { row: 4, name: '', phone: '13600004444', email: 'test@', tier: 'diamond', storeName: '广州天河城店', marketCode: 'cn-mainland', notes: '', validationErrors: ['姓名为空'], isValid: false },
      { row: 5, name: '赵六', phone: '13500005555', email: 'zhaoliu@example.com', tier: 'invalid', storeName: '成都太古里体验店', marketCode: 'cn-mainland', notes: '', validationErrors: ['等级值无效'], isValid: false },
      { row: 6, name: '孙七', phone: '13400006666', email: 'sunqi@example.com', tier: 'bronze', storeName: '杭州银泰旗舰店', marketCode: 'cn-mainland', notes: '', validationErrors: [], isValid: true },
      { row: 7, name: '周八', phone: '13300007777', email: 'zhouba@example.com', tier: 'gold', storeName: 'San Francisco Union Square', marketCode: 'us-default', notes: '美国新客户', validationErrors: [], isValid: true },
      { row: 8, name: '吴九', phone: '13200008888', email: 'wujiu@example.com', tier: 'standard', storeName: '南京德基广场店', marketCode: 'cn-mainland', notes: '', validationErrors: [], isValid: true },
      { row: 9, name: '郑十', phone: '13100009999', email: 'zhengshi@example.com', tier: 'silver', storeName: '伦敦Oxford Street', marketCode: 'uk-default', notes: '', validationErrors: [], isValid: true },
      { row: 10, name: '陈十一', phone: '13000001000', email: '', tier: 'standard', storeName: '重庆来福士店', marketCode: 'cn-mainland', notes: '', validationErrors: [], isValid: true },
      { row: 11, name: '林十二', phone: '18900001111', email: 'lin@example.com', tier: 'standard', storeName: '武汉天地旗舰店', marketCode: 'cn-mainland', notes: '', validationErrors: [], isValid: true },
      { row: 12, name: '黄十三', phone: '18800002222', email: 'huang@example.com', tier: 'bronze', storeName: '苏州中心旗舰店', marketCode: 'cn-mainland', notes: '已电话沟通', validationErrors: [], isValid: true },
    ];

    setPreviewData(mockRecords);
    setIsUploading(false);
    setStage('preview');
  }, [selectedFile]);

  // 导入配置变更
  const handleConfigChange = useCallback(
    (field: keyof ImportConfig, value: string | boolean) => {
      setImportConfig((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // 执行导入
  const handleImport = useCallback(async () => {
    setIsImporting(true);
    setStage('confirming');

    const validRecords = previewData.filter((r) => r.isValid);
    const invalidCount = previewData.filter((r) => !r.isValid).length;

    // 模拟导入延迟
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const progress: ImportProgress = {
      total: previewData.length,
      success: validRecords.length,
      failed: invalidCount,
      errors: invalidCount > 0 ? [`${invalidCount} 条数据校验未通过，已跳过`] : [],
    };

    setImportProgress(progress);
    setImportCompleted(true);
    setIsImporting(false);
    setStage('result');
  }, [previewData]);

  // 重置
  const handleReset = useCallback(() => {
    setStage('upload');
    setSelectedFile(null);
    setPreviewData([]);
    setImportConfig(DEFAULT_IMPORT_CONFIG);
    setImportProgress(null);
    setImportCompleted(false);
    setIsUploading(false);
    setIsImporting(false);
  }, []);

  // 预览统计
  const previewStats = useMemo(() => {
    const valid = previewData.filter((r) => r.isValid).length;
    const invalid = previewData.filter((r) => !r.isValid).length;
    return { total: previewData.length, valid, invalid };
  }, [previewData]);

  // 重置分页
  useMemo(() => {
    if (stage === 'preview') {
      pagination.resetPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, searchTerm]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        workspaceLabel="会员管理"
        workspaceHref="/members"
        extraSegments={[{ label: '批量导入' }]}
      />

      <PageShell
        title="批量导入会员"
        subtitle="通过 CSV / Excel 文件批量创建或更新会员档案"
      >
        {/* ---- 第一阶段：上传 ---- */}
        {stage === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 上传区域 */}
            <section
              style={{
                borderRadius: 16,
                padding: 32,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '2px dashed rgba(148, 163, 184, 0.25)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
                {selectedFile ? selectedFile.name : '选择或拖拽文件到此处'}
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#94a3b8' }}>
                支持 .csv、.xlsx、.xls 格式，文件大小不超过 10MB
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <label
                  style={{
                    display: 'inline-block',
                    padding: '8px 20px',
                    background: 'rgba(59, 130, 246, 0.16)',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    borderRadius: 8,
                    color: '#dbeafe',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  选择文件
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                  />
                </label>
                {selectedFile && (
                  <SubmitButton
                    onClick={() => {
                      setSelectedFile(null);
                    }}
                    variant="secondary"
                  >
                    清除选择
                  </SubmitButton>
                )}
              </div>
              {selectedFile && (
                <div
                  style={{
                    marginTop: 16,
                    fontSize: 13,
                    color: '#93c5fd',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <span>文件大小：{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </section>

            {/* 导入配置 */}
            <section
              style={{
                borderRadius: 16,
                padding: 24,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
                导入配置
              </h3>

              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <FormField label="重复检测字段">
                  <select
                    value={importConfig.duplicateCheck}
                    onChange={(e) => handleConfigChange('duplicateCheck', e.target.value)}
                    style={{ ...inputStyle(false), minHeight: 40 }}
                  >
                    <option value="phone">手机号</option>
                    <option value="name">姓名</option>
                    <option value="none">不检测</option>
                  </select>
                </FormField>
                <FormField label="默认等级">
                  <select
                    value={importConfig.defaultTier}
                    onChange={(e) => handleConfigChange('defaultTier', e.target.value as string)}
                    style={{ ...inputStyle(false), minHeight: 40 }}
                  >
                    <option value="standard">标准</option>
                    <option value="bronze">铜卡</option>
                    <option value="silver">银卡</option>
                    <option value="gold">金卡</option>
                    <option value="diamond">钻石卡</option>
                  </select>
                </FormField>
                <FormField label="默认市场">
                  <select
                    value={importConfig.defaultMarket}
                    onChange={(e) => handleConfigChange('defaultMarket', e.target.value)}
                    style={{ ...inputStyle(false), minHeight: 40 }}
                  >
                    {MARKET_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </FormField>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0', fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={importConfig.sendWelcomeMessage}
                      onChange={(e) => handleConfigChange('sendWelcomeMessage', e.target.checked)}
                      style={{ accentColor: '#3b82f6' }}
                    />
                    导入后发送欢迎消息
                  </label>
                </div>
              </div>
            </section>

            {/* 模板下载 */}
            <section
              style={{
                borderRadius: 12,
                padding: 16,
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>下载导入模板</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  使用模板文件确保数据格式正确，字段包括：{CSV_HEADERS.join('、')}
                </div>
              </div>
              <button
                type="button"
                style={{
                  padding: '6px 16px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(96, 165, 250, 0.25)',
                  borderRadius: 8,
                  color: '#dbeafe',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                下载模板
              </button>
            </section>

            {/* 操作按钮 */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
                padding: '16px 0',
              }}
            >
              <SubmitButton
                variant="secondary"
                onClick={() => router.push('/members')}
              >
                返回会员列表
              </SubmitButton>
              <SubmitButton
                variant="primary"
                loading={isUploading}
                disabled={!selectedFile || isUploading}
                onClick={() => void handleParseFile()}
              >
                {isUploading ? '解析文件中...' : '解析并预览'}
              </SubmitButton>
            </div>
          </div>
        )}

        {/* ---- 第二阶段：预览 ---- */}
        {stage === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 预览统计 */}
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(3, 1fr)',
              }}
            >
              <div
                style={{
                  borderRadius: 12,
                  padding: 16,
                  background: 'rgba(15, 23, 42, 0.35)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                }}
              >
                <div style={{ fontSize: 12, color: '#94a3b8' }}>总记录数</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', marginTop: 4 }}>
                  {previewStats.total}
                </div>
              </div>
              <div
                style={{
                  borderRadius: 12,
                  padding: 16,
                  background: 'rgba(15, 23, 42, 0.35)',
                  border: '1px solid rgba(74, 222, 128, 0.2)',
                }}
              >
                <div style={{ fontSize: 12, color: '#94a3b8' }}>校验通过</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#86efac', marginTop: 4 }}>
                  {previewStats.valid}
                </div>
              </div>
              <div
                style={{
                  borderRadius: 12,
                  padding: 16,
                  background: 'rgba(15, 23, 42, 0.35)',
                  border: '1px solid rgba(248, 113, 113, 0.2)',
                }}
              >
                <div style={{ fontSize: 12, color: '#94a3b8' }}>校验失败</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fca5a5', marginTop: 4 }}>
                  {previewStats.invalid}
                </div>
              </div>
            </div>

            {/* 搜索 */}
            <div>
              <SearchFilterInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="搜索姓名、手机号、门店..."
              />
            </div>

            {/* 数据表格 */}
            <DataTable
              title={`预览数据（共 ${sortedItems.length} 条）`}
              columns={columns}
              items={pageItems}
              rowKey={(item) => `row-${item.row}`}
              sort={sortConfig}
              onSortChange={setSortConfig}
              striped
              compact
            />

            {/* 分页 */}
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={sortedItems.length}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />

            {/* 校验错误详情 */}
            {previewStats.invalid > 0 && (
              <section
                style={{
                  borderRadius: 12,
                  padding: 16,
                  background: 'rgba(127, 29, 29, 0.22)',
                  border: '1px solid rgba(248, 113, 113, 0.24)',
                  color: '#fecaca',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <strong>数据校验提醒：</strong>
                发现 {previewStats.invalid} 条数据存在校验问题，导入时将自动跳过这些记录。
                建议返回修改数据文件后重新上传。
              </section>
            )}

            {/* 操作按钮 */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'space-between',
                padding: '16px 0',
                borderTop: '1px solid rgba(148, 163, 184, 0.15)',
              }}
            >
              <SubmitButton variant="secondary" onClick={handleReset}>
                重新上传
              </SubmitButton>
              <div style={{ display: 'flex', gap: 12 }}>
                <SubmitButton
                  variant="secondary"
                  onClick={() => router.push('/members')}
                >
                  取消
                </SubmitButton>
                <SubmitButton
                  variant="primary"
                  loading={isImporting}
                  disabled={isImporting || previewStats.valid === 0}
                  onClick={() => void handleImport()}
                >
                  {isImporting
                    ? '导入中...'
                    : `确认导入 ${previewStats.valid} 条`}
                </SubmitButton>
              </div>
            </div>
          </div>
        )}

        {/* ---- 第三阶段：结果 ---- */}
        {stage === 'result' && importProgress && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 结果统计 */}
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(3, 1fr)',
              }}
            >
              <div
                style={{
                  borderRadius: 12,
                  padding: 16,
                  background: 'rgba(15, 23, 42, 0.35)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                }}
              >
                <div style={{ fontSize: 12, color: '#94a3b8' }}>总处理</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', marginTop: 4 }}>
                  {importProgress.total}
                </div>
              </div>
              <div
                style={{
                  borderRadius: 12,
                  padding: 16,
                  background: 'rgba(15, 23, 42, 0.35)',
                  border: '1px solid rgba(74, 222, 128, 0.2)',
                }}
              >
                <div style={{ fontSize: 12, color: '#94a3b8' }}>导入成功</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#86efac', marginTop: 4 }}>
                  {importProgress.success}
                </div>
              </div>
              <div
                style={{
                  borderRadius: 12,
                  padding: 16,
                  background: 'rgba(15, 23, 42, 0.35)',
                  border: '1px solid rgba(248, 113, 113, 0.2)',
                }}
              >
                <div style={{ fontSize: 12, color: '#94a3b8' }}>导入失败</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fca5a5', marginTop: 4 }}>
                  {importProgress.failed}
                </div>
              </div>
            </div>

            {/* 导入详情 */}
            <section
              style={{
                borderRadius: 16,
                padding: 24,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
                导入详情
              </h3>
              <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.8 }}>
                <div>
                  ✓ 成功导入 <strong style={{ color: '#86efac' }}>{importProgress.success}</strong> 条会员记录
                </div>
                {importProgress.failed > 0 && (
                  <div>
                    ✗ 跳过 <strong style={{ color: '#fca5a5' }}>{importProgress.failed}</strong> 条无效记录
                  </div>
                )}
                <div>
                  采用{importConfig.duplicateCheck === 'phone' ? '手机号' : importConfig.duplicateCheck === 'name' ? '姓名' : '不'}重复检测策略
                </div>
              </div>

              {importProgress.errors.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, color: '#fca5a5', fontWeight: 600, marginBottom: 8 }}>
                    错误详情：
                  </div>
                  {importProgress.errors.map((err, index) => (
                    <div key={index} style={{ fontSize: 12, color: '#fecaca', padding: '4px 0' }}>
                      • {err}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 操作按钮 */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'space-between',
                padding: '16px 0',
                borderTop: '1px solid rgba(148, 163, 184, 0.15)',
              }}
            >
              <SubmitButton variant="secondary" onClick={handleReset}>
                继续导入
              </SubmitButton>
              <div style={{ display: 'flex', gap: 12 }}>
                <SubmitButton
                  variant="primary"
                  onClick={() => router.push('/members')}
                >
                  返回会员列表
                </SubmitButton>
              </div>
            </div>
          </div>
        )}
      </PageShell>
    </div>
  );
}

// ---- 输入框样式 ----

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`,
    background: 'rgba(15, 23, 42, 0.4)',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
}
