# PowerMTA Integration Setup

This document explains how to configure the PowerMTA integration for CSV file analysis (Accounting, FBL, and Diagnostic files).

## Environment Variables

Add the following variables to your `.env` file:

```env
# PowerMTA File Paths
POWERMTA_ACCT_PATH=/var/log/pmta/acct-*.csv
POWERMTA_FBL_PATH=/var/log/pmta/fbl-*.csv
POWERMTA_DIAG_PATH=/var/log/pmta/diag-*.csv
POWERMTA_CONFIG_PATH=/etc/pmta/config

# Redis Configuration (for scheduling)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0
```

## PowerMTA Log File Formats

### Accounting Files (acct-*.csv)
Expected format: `type,timeLogged,orig,rcpt,vmta,jobId,dsnStatus,dsnMta,bodySize`
- `type`: d (delivered), b (bounced), f (feedback/complaint), r (relay/sent)
- `timeLogged`: Timestamp in ISO format
- `orig`: Sender email address
- `rcpt`: Recipient email address
- `vmta`: Virtual MTA name
- `jobId`: Job identifier
- `dsnStatus`: Delivery status notification status
- `dsnMta`: MTA that generated the DSN
- `bodySize`: Email body size

### FBL Files (fbl-*.csv)
Expected format: `timestamp,orig,rcpt,feedback_type`
- `timestamp`: Timestamp in ISO format
- `orig`: Sender email address
- `rcpt`: Recipient email address
- `feedback_type`: Type of feedback (abuse, spam, etc.)

### Diagnostic Files (diag-*.csv)
Expected format: `timestamp,orig,rcpt,vmta,diag_code,diag_text`
- `timestamp`: Timestamp in ISO format
- `orig`: Sender email address
- `rcpt`: Recipient email address
- `vmta`: Virtual MTA name
- `diag_code`: Diagnostic code
- `diag_text`: Diagnostic message text

## File Permissions

Ensure the Laravel application has read access to PowerMTA log files:

```bash
# Add web server user to pmta group (adjust user as needed)
sudo usermod -a -G pmta www-data

# Set appropriate permissions on log directory
sudo chmod 755 /var/log/pmta
sudo chmod 644 /var/log/pmta/*.csv
```

## Training Configuration

The system uses a single training configuration applied to all domains:

- **Initial Rate**: 100 emails/hour
- **Increase Factor**: 2x when metrics are good
- **Max Bounce Rate**: 5%
- **Max Complaint Rate**: 0.1%
- **Early Stage**: < 5,000 total emails sent
- **Mid Stage**: 5,000 - 20,000 total emails sent
- **Mature Stage**: > 20,000 total emails sent

### Provider Limits (hourly rates)
- Gmail: 2,000/hour
- Yahoo: 1,000/hour
- Microsoft/Outlook: 500/hour
- Other providers: 1,000/hour

## Redis Scheduling

The system uses Redis for persistent scheduling of domain monitoring:

### Manual Commands

```bash
# Run domain monitoring manually
php artisan domains:monitor

# Force run monitoring regardless of schedule
php artisan domains:monitor --force

# Clear all monitoring data
php artisan domains:monitor --clear
```

### Cron Setup

Add to your crontab for automatic monitoring:

```bash
# Check every minute for scheduled monitoring
* * * * * cd /path/to/your/project && php artisan domains:monitor >> /dev/null 2>&1
```

## API Endpoints

### PowerMTA Analytics
- `GET /api/powermta/training/config` - Get training configuration
- `GET /api/powermta/domains/analytics` - Get all domains analytics
- `POST /api/powermta/domains/training/check` - Manual training check
- `GET /api/powermta/domains/{domainId}/analytics` - Get domain analytics
- `GET /api/powermta/domains/{domainId}/accounting` - Get accounting metrics
- `GET /api/powermta/domains/{domainId}/fbl` - Get FBL data
- `GET /api/powermta/domains/{domainId}/diagnostics` - Get diagnostic data
- `POST /api/powermta/domains/{domainId}/training/apply` - Apply training config
- `PUT /api/powermta/domains/{domainId}/config` - Update domain config

### Monitoring
- `GET /api/monitoring/status` - Get monitoring status
- `GET /api/monitoring/results` - Get all monitoring results
- `POST /api/monitoring/run` - Force run monitoring
- `GET /api/monitoring/domains/{domainId}/result` - Get domain result
- `POST /api/monitoring/domains/{domainId}/schedule` - Schedule domain check
- `DELETE /api/monitoring/clear` - Clear monitoring data

## Health Scoring

Domain health is calculated based on:
- **Delivery Rate** (weight: 2): > 95% is excellent
- **Bounce Rate** (weight: 3): < 5% is good
- **Complaint Rate** (weight: 10): < 0.1% is good
- **FBL Complaints** (weight: 2): < 10 complaints is good
- **Diagnostic Issues** (weight: 0.5): < 50 issues is good

Health scores:
- **Excellent**: 85-100%
- **Good**: 70-84%
- **Fair**: 50-69%
- **Poor**: < 50%

## Troubleshooting

### File Not Found Issues
1. Check file paths in environment variables
2. Verify file permissions
3. Ensure PowerMTA is generating log files in expected format

### Redis Connection Issues
1. Verify Redis is running: `redis-cli ping`
2. Check Redis configuration in `.env`
3. Test Redis connection: `php artisan tinker` then `Redis::ping()`

### Permission Issues
1. Check Laravel storage permissions: `chmod -R 775 storage`
2. Verify web server can read PowerMTA logs
3. Check SELinux if enabled: `setsebool -P httpd_can_network_connect 1`

### Database Issues
1. Run migrations: `php artisan migrate`
2. Check domain table has required fields
3. Verify foreign key constraints

## Performance Optimization

### Caching
- Analytics results are cached for 5 minutes
- Monitoring results are cached for 24 hours
- Adjust cache TTL in `config/powermta.php`

### File Processing
- Large log files may require memory limit adjustment
- Consider log rotation to prevent files from growing too large
- Use `head` or `tail` commands for testing with large files

### Database Optimization
- Add indexes on frequently queried fields
- Consider partitioning for large datasets
- Regular database maintenance and optimization
