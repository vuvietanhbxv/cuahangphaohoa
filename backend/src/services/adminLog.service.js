// Ghi nhận mọi hành động admin để admin khác audit được.

export async function logAdminAction(prisma, {
  adminId,
  action,
  targetType,
  targetId = null,
  oldValue = null,
  newValue = null,
  note = null,
  ipAddress = null,
}) {
  try {
    return await prisma.adminActivityLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        note,
        ipAddress,
      },
    });
  } catch (err) {
    // Best-effort, không block business logic
    console.error("logAdminAction failed:", err.message);
    return null;
  }
}
