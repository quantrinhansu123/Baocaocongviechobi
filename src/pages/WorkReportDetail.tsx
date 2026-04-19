import React, { useState } from 'react';
import { Edit2, X, Star, Calendar, User, MessageSquare, AlertCircle, ChevronDown } from 'lucide-react';

// --- MOCK DATA ---
const initialTasks = [
  { id: 1, name: 'Sản xuất đơn hàng ván sàn A', assignee: 'Anh Tài', deadline: '2026-04-23', status: 'Hoàn thành', impact: 4, desc: 'Sản xuất 500m2 sàn gỗ ngoài trời 2D.', history: 'Đã hoàn tất khâu ép nhiệt.' },
  { id: 2, name: 'Fix lỗi ván ép lô B', assignee: 'Anh Tuấn', deadline: '2026-04-07', status: 'Trễ hạn', impact: 3, desc: 'Lô B bị lỗi cong vênh 5%, cần kiểm tra lại máy ép.', history: 'Đang đợi linh kiện thay thế từ TQ.' },
  { id: 3, name: 'Kiểm tra công nợ nhà cung cấp hạt nhựa', assignee: 'Chị Lan', deadline: '2026-04-18', status: 'Đang làm', impact: 2, desc: 'Đối chiếu công nợ quý 1.', history: 'Đã gửi email đối chiếu, chờ phản hồi.' },
  { id: 4, name: 'Bảo trì máy nghiền gỗ', assignee: 'Chú Hải', deadline: '2026-04-10', status: 'Trễ hạn', impact: 4, desc: 'Bảo trì định kỳ máy số 2.', history: 'Thiếu nhân sự bảo trì.' },
  { id: 5, name: 'Lên kế hoạch sản xuất tháng 5', assignee: 'Anh Tuyển', deadline: '2026-04-28', status: 'Đang làm', impact: 3, desc: 'Chốt số lượng với mảng OEM và Thương mại.', history: 'Đang tổng hợp số liệu.' },
];

export default function ReportDetailScreen() {
  const [tasks, setTasks] = useState(initialTasks);
  const [filterImportant, setFilterImportant] = useState(false);
  const [filterOverdue, setFilterOverdue] = useState(false);

  // State cho Inline Edit
  const [editingCell, setEditingCell] = useState({ id: null, field: null });

  // State cho Modal
  const [selectedTask, setSelectedTask] = useState(null);

  // Xử lý lọc dữ liệu
  const filteredTasks = tasks.filter(task => {
    let match = true;
    if (filterImportant && task.impact < 3) match = false;
    if (filterOverdue && task.status !== 'Trễ hạn') match = false;
    return match;
  });

  // Xử lý lưu dữ liệu inline
  const handleInlineSave = (id, field, value) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
    setEditingCell({ id: null, field: null });
  };

  // Render Badge Trạng thái
  // Render Badge Trạng thái
  const renderStatus = (status) => {
    switch (status) {
      case 'Hoàn thành': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">🟢 Hoàn Thành</span>;
      case 'Trễ hạn': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">🔴 Quá Hạn</span>;
      // Đổi mặc định từ Đang làm -> Sắp đến hạn (màu vàng/cam)
      default: return <span className="px-3 py-1 bg-orange-100 text-[#F38320] rounded-full text-xs font-semibold">🟡 Sắp Đến Hạn</span>;
    }
  };

  // Render Cột Ảnh hưởng (Stars)
  const renderImpact = (level) => {
    return (
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <Star key={i} size={16} className={i < level ? "fill-[#F38320] text-[#F38320]" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">

      {/* 1. Header & Filters */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#1E386B] flex items-center gap-2">
            <AlertCircle className="text-[#F38320]" />
            Báo Cáo Tuần Nhà Máy
          </h1>
          {/* <button className="bg-[#1E386B] text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition">
            Xuất báo cáo
          </button> */}
        </div>

        <div className="flex gap-4">
          <label className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition ${filterImportant ? 'border-[#F38320] bg-orange-50 text-[#F38320]' : 'border-gray-300'}`}>
            <input type="checkbox" className="hidden" checked={filterImportant} onChange={() => setFilterImportant(!filterImportant)} />
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${filterImportant ? 'bg-[#F38320] border-[#F38320]' : 'border-gray-400'}`}>
              {filterImportant && <X size={12} className="text-white" />}
            </div>
            <span className="font-medium text-sm">Chỉ việc quan trọng (3-4)</span>
          </label>

          <label className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition ${filterOverdue ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300'}`}>
            <input type="checkbox" className="hidden" checked={filterOverdue} onChange={() => setFilterOverdue(!filterOverdue)} />
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${filterOverdue ? 'bg-red-500 border-red-500' : 'border-gray-400'}`}>
              {filterOverdue && <X size={12} className="text-white" />}
            </div>
            <span className="font-medium text-sm">Chỉ việc quá hạn</span>
          </label>
        </div>
      </div>

      {/* 2. Main Data Table */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1E386B] text-white">
              <th className="p-4 font-semibold text-center w-16">STT</th>
              <th className="p-4 font-semibold">Công việc</th>
              <th className="p-4 font-semibold w-40">Người phụ trách</th>
              <th className="p-4 font-semibold w-40">Deadline</th>
              <th className="p-4 font-semibold w-40">Trạng thái</th>
              <th className="p-4 font-semibold w-32">Ảnh hưởng</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task, index) => (
              <tr key={task.id} className="border-b hover:bg-gray-50 transition group">
                <td className="p-4 text-center text-gray-500 font-medium">{index + 1}</td>

                {/* Click mở Modal */}
                <td className="p-4">
                  <span
                    className="font-medium text-[#1E386B] cursor-pointer hover:text-[#F38320] transition underline-offset-4 hover:underline"
                    onClick={() => setSelectedTask(task)}
                  >
                    {task.name}
                  </span>
                </td>

                {/* Inline Edit: Người phụ trách */}
                <td className="p-4 relative">
                  {editingCell.id === task.id && editingCell.field === 'assignee' ? (
                    <input
                      type="text" autoFocus
                      className="border border-[#F38320] outline-none rounded p-1 w-full"
                      defaultValue={task.assignee}
                      onBlur={(e) => handleInlineSave(task.id, 'assignee', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInlineSave(task.id, 'assignee', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 cursor-pointer group/edit" onClick={() => setEditingCell({ id: task.id, field: 'assignee' })}>
                      <User size={16} className="text-gray-400" />
                      {task.assignee}
                      <Edit2 size={14} className="text-gray-300 opacity-0 group-hover/edit:opacity-100 group-hover/edit:text-[#F38320]" />
                    </div>
                  )}
                </td>

                {/* Inline Edit: Deadline */}
                <td className="p-4 relative">
                  {editingCell.id === task.id && editingCell.field === 'deadline' ? (
                    <input
                      type="date" autoFocus
                      className="border border-[#F38320] outline-none rounded p-1 w-full"
                      defaultValue={task.deadline}
                      onBlur={(e) => handleInlineSave(task.id, 'deadline', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 cursor-pointer group/edit" onClick={() => setEditingCell({ id: task.id, field: 'deadline' })}>
                      <Calendar size={16} className={new Date(task.deadline) < new Date() && task.status !== 'Hoàn thành' ? 'text-red-500' : 'text-gray-400'} />
                      <span className={new Date(task.deadline) < new Date() && task.status !== 'Hoàn thành' ? 'text-red-500 font-medium' : ''}>{task.deadline}</span>
                      <Edit2 size={14} className="text-gray-300 opacity-0 group-hover/edit:opacity-100 group-hover/edit:text-[#F38320]" />
                    </div>
                  )}
                </td>

                {/* Inline Edit: Trạng thái */}
                <td className="p-4 relative">
                  {editingCell.id === task.id && editingCell.field === 'status' ? (
                    <div className="relative w-full">
                      <select
                        autoFocus
                        className="w-full appearance-none bg-white border-2 border-[#F38320] text-gray-700 text-sm font-semibold rounded-lg pl-3 pr-8 py-1.5 outline-none shadow-sm cursor-pointer transition-all focus:ring-4 focus:ring-[#F38320]/20"
                        defaultValue={task.status}
                        onBlur={(e) => handleInlineSave(task.id, 'status', e.target.value)}
                        onChange={(e) => handleInlineSave(task.id, 'status', e.target.value)}
                      >
                        <option value="Sắp đến hạn">🟡 Sắp Đến Hạn</option>
                        <option value="Hoàn thành">🟢 Hoàn Thành</option>
                        <option value="Trễ hạn">🔴 Quá Hạn</option>
                      </select>
                      {/* Custom Icon mũi tên thả xuống */}
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#F38320]">
                        <ChevronDown size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 cursor-pointer group/edit" onClick={() => setEditingCell({ id: task.id, field: 'status' })}>
                      {renderStatus(task.status)}
                      <Edit2 size={14} className="text-gray-300 opacity-0 group-hover/edit:opacity-100 group-hover/edit:text-[#F38320] transition-opacity" />
                    </div>
                  )}
                </td>

                <td className="p-4">{renderImpact(task.impact)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Popup Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header Modal */}
            <div className="bg-[#1E386B] text-white p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedTask.name}</h2>
              <button onClick={() => setSelectedTask(null)} className="hover:bg-white/20 p-1 rounded transition">
                <X size={24} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 grid grid-cols-3 gap-8 overflow-y-auto">
              {/* Cột trái: Thông tin */}
              <div className="col-span-1 space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Người phụ trách</p>
                  <p className="font-semibold flex items-center gap-2"><User size={18} className="text-[#1E386B]" /> {selectedTask.assignee}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Deadline</p>
                  <p className="font-semibold flex items-center gap-2"><Calendar size={18} className="text-[#1E386B]" /> {selectedTask.deadline}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Trạng thái</p>
                  {renderStatus(selectedTask.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Mức độ ảnh hưởng</p>
                  {renderImpact(selectedTask.impact)}
                </div>
              </div>

              {/* Cột phải: Mô tả & Lịch sử */}
              <div className="col-span-2 space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="font-semibold text-[#1E386B] mb-2 flex items-center gap-2">Mô tả chi tiết</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedTask.desc}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="font-semibold text-[#1E386B] mb-2 flex items-center gap-2">Lịch sử cập nhật</h3>
                  <div className="border-l-2 border-[#F38320] pl-4 py-1 ml-2">
                    <p className="text-sm text-gray-500">Hôm qua</p>
                    <p className="text-gray-700">{selectedTask.history}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal: Comment */}
            <div className="border-t border-gray-200 p-5 bg-gray-50 flex items-start gap-3">
              <MessageSquare className="text-gray-400 mt-2" />
              <div className="flex-1">
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#F38320] focus:ring-1 focus:ring-[#F38320] transition resize-none"
                  rows="2"
                  placeholder="Thêm bình luận, chỉ đạo hoặc cập nhật trạng thái..."
                ></textarea>
                <div className="flex justify-end mt-2">
                  <button className="bg-[#F38320] text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition">
                    Gửi
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}