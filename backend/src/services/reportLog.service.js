// Ghi log thay đổi trạng thái của FraudReport.
// Mỗi action quan trọng (submit, admin moderate, add-info, duplicate merge) phải có 1 entry.

export async function logReportStatus(prisma, {
  reportId,
  changedById = null,
  oldStatus = null,
  newStatus,
  action,
  note = null,
}) {
  return prisma.reportStatusLog.create({
    data: { reportId, changedById, oldStatus, newStatus, action, note },
  });
}
