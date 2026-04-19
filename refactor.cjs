const fs = require('fs');

let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

// Add Tabs & Grid
if (!code.includes('Tabs,')) {
    code = code.replace('Spin,', 'Spin,\n  Tabs,\n  Grid,');
}

// Keep everything before weekOptions
const cutIndex = code.indexOf('const weekOptions = generateWeekOptions();');
const beforeCode = code.substring(0, cutIndex);

const afterModalIndex = code.indexOf('{/* --- MODAL CHI TIẾT --- */}');
const afterCode = code.substring(afterModalIndex);

const newMiddle = `const weekOptions = generateWeekOptions();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const filtersNode = (
    <>
      {/* --- BỘ LỌC TỔNG --- */}
      <div className="dashboard-filters flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-2 md:p-4 rounded-lg shadow-sm">
        <Space wrap className="w-full md:w-auto mb-2 md:mb-0">
          <Select
            showSearch
            value={filterWeek}
            onChange={setFilterWeek}
            className="filter-select rounded-lg shadow-sm"
            style={{ width: 220 }}
            options={[{ value: 'all', label: 'Tất cả các tuần' }, ...weekOptions]}
            placeholder="Chọn tuần làm việc"
          />
          <Select
            value={filterDept}
            onChange={setFilterDept}
            className="filter-select rounded-lg"
            style={{ width: 160 }}
            options={[
              { value: 'all', label: 'Tất cả phòng ban' },
              { value: 'Nhà máy', label: 'Nhà máy' },
              { value: 'OEM', label: 'OEM' },
              { value: 'Thương mại', label: 'Thương mại' },
              { value: 'Kế toán', label: 'Kế toán' },
            ]}
          />
          <Select
            value={filterPriority}
            onChange={setFilterPriority}
            className="filter-select rounded-lg"
            style={{ width: 180 }}
            options={[
              { value: 'all', label: 'Mọi mức độ' },
              { value: 'high', label: '⭐ Quan trọng (3-4)' },
              { value: 'low', label: 'Bình thường (1-2)' },
            ]}
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            className="filter-select rounded-lg border-orange-400"
            style={{ width: 220 }}
            options={[
              { value: 'all', label: 'Tất cả tiến độ' },
              { value: 'in_progress', label: ' Đang Làm' },
              { value: 'overdue', label: ' Quá Hạn' },
              { value: 'completed', label: ' Hoàn Thành' },
              { value: 'ext_1', label: ' Hoàn Thành Gia Hạn 1' },
              { value: 'ext_2', label: ' Hoàn Thành Gia Hạn 2' },
              { value: 'ext_3', label: ' Hoàn Thành Gia Hạn 3' },
            ]}
          />
        </Space>
      </div>
    </>
  );

  const kpisNode = (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-2 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col justify-center h-full">
          <span className="text-gray-500 text-[11px] md:text-sm mb-1 line-clamp-1">Tổng công việc</span>
          <div className="flex items-center flex-row">
            <FileTextOutlined className="text-blue-500 text-[18px] md:text-2xl mr-1.5 md:mr-2" />
            <span className="text-[#1e3a8a] text-[16px] md:text-[24px] font-bold leading-none">{displayStats.total}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-2 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col justify-center h-full">
          <span className="text-gray-500 text-[11px] md:text-sm mb-1 line-clamp-1">Đã hoàn thành</span>
          <div className="flex items-center flex-row">
            <CheckCircleOutlined className="text-green-500 text-[18px] md:text-2xl mr-1.5 md:mr-2" />
            <span className="text-[#10b981] text-[16px] md:text-[24px] font-bold leading-none">{displayStats.completed}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-red-50 p-2 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-red-100 flex flex-col justify-center h-full">
          <span className="text-red-700 font-medium text-[11px] md:text-sm mb-1 line-clamp-1">🔴 Quá hạn nộp</span>
          <div className="flex items-center flex-row">
            <ClockCircleOutlined className="text-red-600 text-[18px] md:text-2xl mr-1.5 md:mr-2" />
            <span className="text-[#dc2626] text-[16px] md:text-[24px] font-bold leading-none">{displayStats.overdue}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-orange-50 p-2 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-orange-100 flex flex-col justify-center h-full">
          <span className="text-orange-700 font-medium text-[11px] md:text-sm mb-1 line-clamp-1 font-sans tracking-tight">⭐ Việc quan trọng</span>
          <div className="flex items-center flex-row">
            <FireOutlined className="text-orange-600 text-[18px] md:text-2xl mr-1.5 md:mr-2" />
            <span className="text-[#ea580c] text-[16px] md:text-[24px] font-bold leading-none">{displayStats.highPriority}</span>
          </div>
        </div>

      </div>
    </div>
  );

  const listsNode = (
    <div className="space-y-4 md:space-y-6">
      <Card
        title={<span className="text-red-600 font-bold uppercase"><ClockCircleOutlined className="mr-2" />🔴 DANH SÁCH VIỆC QUÁ HẠN</span>}
        variant="borderless"
        className="shadow-sm border border-red-100"
        styles={{ body: { padding: 0 } }}
      >
        {/* Desktop View: Table */}
        <div className="hidden md:block p-4">
          {displayOverdue.length > 0 ? (
            <Table
              dataSource={displayOverdue.slice(0, 30)}
              columns={overdueColumns}
              pagination={false}
              scroll={{ y: 300 }}
              size="small"
              rowKey="id"
              onRow={(record) => ({ onClick: () => handleRowClick(record) })}
            />
          ) : <Empty description="Tuyệt vời! Không có công việc nào bị quá hạn." />}
        </div>

        {/* Mobile View: Card List */}
        <div className="block md:hidden p-4 space-y-3 max-h-[400px] overflow-y-auto bg-red-50/30">
          {displayOverdue.length > 0 ? displayOverdue.map(task => (
            <div
              key={task.id}
              onClick={() => handleRowClick(task)}
              className="relative bg-white rounded-lg p-4 shadow-sm border border-red-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
              <div className="flex flex-col pl-2">
                <Text strong className="text-red-600 text-base leading-tight mb-2 pr-2 line-clamp-2">{task.name}</Text>
                <div className="flex justify-between items-center text-sm mb-2">
                  <Tag className="m-0 border-none bg-gray-100 text-gray-700">{task.department}</Tag>
                  <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-xs border border-red-100">Hạn: {task.deadline}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <User size={14} className="mr-1" /> {task.assignee}
                </div>
              </div>
            </div>
          )) : <Empty description="Tuyệt vời! Không có công việc nào bị quá hạn." />}
        </div>
      </Card>

      {/* VIỆC ẢNH HƯỞNG CAO */}
      <Card
        title={<span className="text-orange-600 font-bold uppercase"><FireOutlined className="mr-2" />⭐ VIỆC ẢNH HƯỞNG CAO ĐANG LÀM (MỨC 3-4)</span>}
        variant="borderless"
        className="shadow-sm border border-orange-100"
        styles={{ body: { padding: 0 } }}
      >
        {/* Desktop View: Table */}
        <div className="hidden md:block p-4">
          {displayImportant.length > 0 ? (
            <Table
              dataSource={displayImportant.slice(0, 30)}
              columns={importantColumns}
              pagination={false}
              scroll={{ y: 300 }}
              size="small"
              rowKey="id"
              onRow={(record) => ({ onClick: () => handleRowClick(record) })}
            />
          ) : <Empty description="Không có công việc quan trọng nào đang làm." />}
        </div>

        {/* Mobile View: Card List */}
        <div className="block md:hidden p-4 space-y-3 max-h-[400px] overflow-y-auto bg-orange-50/30">
          {displayImportant.length > 0 ? displayImportant.map(task => (
            <div
              key={task.id}
              onClick={() => handleRowClick(task)}
              className="relative bg-white rounded-lg p-4 shadow-sm border border-orange-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F38320]"></div>
              <div className="flex flex-col pl-2">
                <Text strong className="text-[#F38320] text-base leading-tight mb-2 line-clamp-2">{task.name}</Text>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center">
                    <User size={14} className="mr-1" /> {task.assignee}
                  </span>
                  {/* renderImpact is accessible here */}
                  {renderImpact(task.impact)}
                </div>
              </div>
            </div>
          )) : <Empty description="Không có công việc quan trọng nào đang làm." />}
        </div>
      </Card>
    </div>
  );

  const timelineNode = (
    <Card
      title={<span className="text-red-600 font-bold">⚠️ CÁC CÔNG VIỆC VƯỚNG MẮC</span>}
      variant="borderless"
      className="shadow-sm h-full border border-red-100 overflow-y-auto max-h-[1000px]"
    >
      {displayIssues.length > 0 ? (
        <Timeline
          items={displayIssues.slice(0, 30).map(issue => ({
            color: issue.status === 'Quá hạn' ? 'red' : 'orange',
            children: (
              <div
                className="pb-4 cursor-pointer hover:bg-gray-100 p-2 -ml-2 rounded-lg transition-colors"
                onClick={() => handleRowClick(issue)}
              >
                <div className="font-bold text-[#1677ff] hover:underline text-sm mb-1">
                  {issue.name}
                </div>
                <p className="text-sm text-gray-600 m-0 line-clamp-2">{issue.history}</p>
              </div>
            ),
          }))}
        />
      ) : (
        <Empty description="Mọi thứ đang suôn sẻ, không có vướng mắc nào!" />
      )}
    </Card>
  );

  const chartNode = (
    <Card title="📊 BIỂU ĐỒ THEO PHÒNG BAN" variant="borderless" className="shadow-sm border border-gray-100">
      <div style={{ height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartDataRecharts} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6B7280' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6B7280' }} />
            <RechartsTooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
            <Bar dataKey="Hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="Hoàn thành" content={<SmartLabel />} />
            </Bar>
            <Bar dataKey="Đang làm" fill="#fa8c16" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="Đang làm" content={<SmartLabel />} />
            </Bar>
            <Bar dataKey="Quá hạn" fill="#ef4444" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="Quá hạn" content={<SmartLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  return (
    <div className="dashboard-container space-y-4 md:space-y-6 bg-gray-50 min-h-screen p-3 md:p-6 relative">
      
      {/* ─── HIỂN THỊ DESKTOP ─── */}
      {!isMobile && (
        <div className="hidden md:block">
          {filtersNode}
          <div className="mt-6">{kpisNode}</div>
          <Row gutter={[16, 16]} className="mt-6">
            <Col xs={24} lg={16}>{listsNode}</Col>
            <Col xs={24} lg={8}>{timelineNode}</Col>
          </Row>
          <Row className="mt-6">
            <Col xs={24}>{chartNode}</Col>
          </Row>
        </div>
      )}

      {/* ─── HIỂN THỊ MOBILE (TABS) ─── */}
      {isMobile && (
        <div className="block md:hidden">
          <Tabs
            centered
            className="mobile-sticky-tabs"
            items={[
              {
                key: '1',
                label: 'Báo cáo',
                children: (
                  <div className="space-y-4">
                    {filtersNode}
                    {kpisNode}
                    {chartNode}
                  </div>
                )
              },
              {
                key: '2',
                label: 'Cảnh báo công việc',
                children: (
                  <div className="space-y-4">
                    {listsNode}
                  </div>
                )
              }
            ]}
          />
          {/* Cột Vướng mắc kéo ra ngoài Tabs nằm dưới cùng */}
          <div className="mt-4">
            {timelineNode}
          </div>
        </div>
      )}

      `;

const fullCode = beforeCode + newMiddle + afterCode;
fs.writeFileSync('src/pages/Dashboard.tsx', fullCode);
