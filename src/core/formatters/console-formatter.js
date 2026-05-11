const chalk = require('chalk');

class ConsoleFormatter {
  static header(title, subtitle = '') {
    console.log('');
    console.log(chalk.bold.cyan(`📊 ${title}`));
    if (subtitle) {
      console.log(chalk.gray(subtitle));
    }
    console.log('');
  }

  static section(title, count = null) {
    const line = '━'.repeat(60);
    const countStr = count !== null ? chalk.gray(` (${count})`) : '';
    console.log('');
    console.log(chalk.dim(line));
    console.log(chalk.bold(`${title}${countStr}`));
    console.log(chalk.dim(line));
    console.log('');
  }

  static issueList(issues, maxShow = null) {
    const toShow = maxShow ? issues.slice(0, maxShow) : issues;
    
    toShow.forEach((issue, index) => {
      const icon = this.getSeverityIcon(issue.severity);
      const color = this.getSeverityColor(issue.severity);
      
      console.log(chalk[color](`${index + 1}. ${icon} ${issue.severity} — ${issue.name}@${issue.version}`));
      console.log(chalk.gray(`   → ${issue.message}`));
      if (issue.risk) {
        console.log(chalk.gray(`   → Risk: ${issue.risk}`));
      }
      console.log(chalk.gray(`   → Fix: ${issue.fix}`));
      console.log('');
    });
    
    if (maxShow && issues.length > maxShow) {
      console.log(chalk.gray(`   ... and ${issues.length - maxShow} more\n`));
    }
  }

  static summary(stats) {
    const items = [
      { label: '🔴 Critical', value: stats.critical, color: 'red' },
      { label: '🟠 High', value: stats.high, color: 'yellow' },
      { label: '🟡 Medium', value: stats.medium, color: 'blue' },
      { label: '⚪ Low', value: stats.low, color: 'gray' }
    ];

    items.forEach(item => {
      if (item.value > 0) {
        console.log(chalk[item.color](`${item.label}: ${item.value}`));
      }
    });

    if (stats.total === 0) {
      console.log(chalk.green('✅ No issues found'));
    }
  }

  static actions(actions) {
    console.log(chalk.bold('\n⚡ Quick Actions\n'));
    actions.forEach(action => {
      console.log(chalk.cyan(`  ${action.icon} ${action.label}`));
      console.log(chalk.gray(`    ${action.command}`));
      console.log('');
    });
  }

  static healthScore(score) {
    const icon = this.getHealthIcon(score);
    const color = this.getHealthColor(score);
    const label = this.getHealthLabel(score);
    console.log(chalk[color](`\n${icon} Health Score: ${score.toFixed(1)} / 10  (${label})\n`));
  }

  static getHealthIcon(score) {
    if (score >= 9) return '🟢';
    if (score >= 8) return '✅';
    if (score >= 6) return '⚠️';
    if (score >= 4) return '🟠';
    return '🔴';
  }

  static getHealthColor(score) {
    if (score >= 8) return 'green';
    if (score >= 6) return 'yellow';
    return 'red';
  }

  static getHealthLabel(score) {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Good';
    if (score >= 6) return 'Needs Attention';
    if (score >= 4) return 'Poor';
    return 'Critical';
  }

  static box(content, title = '') {
    const width = 60;
    const top = '┌' + '─'.repeat(width - 2) + '┐';
    const bottom = '└' + '─'.repeat(width - 2) + '┘';
    
    console.log(chalk.cyan(top));
    if (title) {
      console.log(chalk.bold.cyan(`│ ${title}`.padEnd(width - 1)) + chalk.cyan('│'));
      console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
    }
    
    const lines = content.split('\n');
    lines.forEach(line => {
      console.log(chalk.white(`│ ${line}`.padEnd(width - 1)) + chalk.cyan('│'));
    });
    
    console.log(chalk.cyan(bottom));
  }

  static getSeverityIcon(severity) {
    const icons = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '⚪'
    };
    return icons[severity] || '⚠️';
  }

  static getSeverityColor(severity) {
    const colors = {
      CRITICAL: 'red',
      HIGH: 'yellow',
      MEDIUM: 'blue',
      LOW: 'gray'
    };
    return colors[severity] || 'white';
  }
}

module.exports = { ConsoleFormatter };
