import Organization from './organization';
import User from './user';
import Budget from './budget';
import Income from './income';
import Expense from './expense';
import Transaction from './transaction';
import AuditPeriod from './audit_period';
import Account from './account';

Organization.hasOne(User, {
    onDelete: 'CASCADE',
});
User.belongsTo(Organization);

Organization.hasMany(Budget, {
    onDelete: 'CASCADE',
});
Budget.belongsTo(Organization);

Organization.hasMany(Account, {
    onDelete: 'CASCADE',
});
Account.belongsTo(Organization);

Budget.hasMany(Income, {
    onDelete: 'CASCADE',
});
Income.belongsTo(Budget);

Budget.hasMany(Expense, {
    onDelete: 'CASCADE',
});
Expense.belongsTo(Budget);

Income.hasMany(Transaction, {
    onDelete: 'CASCADE',
});
Transaction.belongsTo(Income);

Expense.hasMany(Transaction, {
    onDelete: 'CASCADE',
});
Transaction.belongsTo(Expense);

export {
    Organization,
    User,
    Budget,
    Income,
    Expense,
    Transaction,
    AuditPeriod,
    Account,
};
