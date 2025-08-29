# Deployment Backup & Restore System

## Overview

The deployment scripts now include comprehensive backup and restore functionality for both frontend and backend deployments. This ensures that if a deployment fails, the system can automatically restore to the previous working state.

## Backup Strategy

### Backend Backups
- **Location**: `/home/campaignprox/domains/api.msz-pl.com/public_html/backups/`
- **Files backed up**:
  - Complete backend directory as `backend_backup_YYYYMMDD_HHMMSS.tar.gz`
  - Database as `database_backup_YYYYMMDD_HHMMSS.sqlite`
  - Backup state tracking in `.last_backup` file
- **Retention**: Last 5 backups are kept automatically

### Frontend Backups
- **Location**: `/home/campaignprox/backups/`
- **Files backed up**:
  - Complete frontend directory as `frontend_backup_YYYYMMDD_HHMMSS.tar.gz`
  - Backup state tracking in `.last_frontend_backup` file
- **Retention**: Last 5 backups are kept automatically

## Automatic Restore on Failure

Both deployment scripts (`deploy-backend.sh` and `deploy-frontend.sh`) automatically:

1. **Create backup** before starting deployment
2. **Deploy new files** using temporary locations
3. **Validate deployment** with comprehensive checks
4. **Auto-restore on failure** if any step fails
5. **Clean up** temporary files on success

## Manual Rollback

Use the enhanced `rollback.sh` script for manual rollback operations:

### List Available Backups
```bash
./rollback.sh --list
```

### Rollback Both Frontend and Backend (Latest)
```bash
./rollback.sh
```

### Rollback Specific Component
```bash
./rollback.sh --component backend
./rollback.sh --component frontend
```

### Rollback to Specific Timestamp
```bash
./rollback.sh --component backend --timestamp 20250811_143022
./rollback.sh --component both --timestamp 20250811_143022
```

## Queue and Cron Preservation

The backup/restore system preserves:

- ✅ **Queue worker processes** - Automatically restarted after restore
- ✅ **Cron job configurations** - Preserved in backup archives
- ✅ **Laravel scheduler settings** - Maintained through restore process
- ✅ **Environment configurations** - `.env` files are backed up and restored

## Safety Features

1. **Pre-rollback backups**: Current state is backed up before any rollback
2. **Validation checks**: Critical files are verified before considering deployment successful
3. **Service management**: Web services are properly stopped/started during operations
4. **Permission fixing**: Ownership and permissions are restored correctly
5. **Database integrity**: Database backups are handled separately for safety

## File Structure

```
Backend Backups:
/home/campaignprox/domains/api.msz-pl.com/public_html/backups/
├── backend_backup_20250811_143022.tar.gz
├── database_backup_20250811_143022.sqlite
├── .last_backup
└── pre_rollback_20250811_150030.tar.gz

Frontend Backups:
/home/campaignprox/backups/
├── frontend_backup_20250811_143022.tar.gz
├── .last_frontend_backup
└── pre_rollback_frontend_20250811_150030.tar.gz
```

## Error Handling

- If deployment fails at any stage, automatic restore is triggered
- If restore fails, the system maintains pre-rollback backups
- All operations include comprehensive error checking and logging
- Services are gracefully managed during failures

## Integration with Jenkins

The Jenkins pipeline automatically benefits from this system:
- Each deployment creates timestamped backups
- Failed deployments are automatically rolled back
- No manual intervention required for most failure scenarios
- Rollback operations can be triggered manually if needed

## Best Practices

1. **Monitor backup disk space** - Old backups are cleaned automatically but monitor overall usage
2. **Test rollback procedures** - Occasionally test manual rollback to ensure system works
3. **Verify backup integrity** - The system validates backups during creation
4. **Check queue worker status** - Monitor that queue workers restart properly after operations
