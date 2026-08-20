const AuditLog = require('../models/AuditLog');
const { inMemoryStore } = require('../config/database');

const getAuditLogs = async (req, res, next) => {
  try {
    const { eventType, status, limit = 50 } = req.query;
    const query = {};

    if (eventType) query.eventType = eventType;
    if (status) query.status = status;

    let logs = [];
    try {
      logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit, 10))
        .lean();
    } catch (e) {
      logs = inMemoryStore.auditLogs;
      if (eventType) logs = logs.filter(l => l.eventType === eventType);
      if (status) logs = logs.filter(l => l.status === status);
    }

    res.json({
      success: true,
      data: logs
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };
