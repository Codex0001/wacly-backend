// utils/idGenerator.js
const generateEmployeeId = async (role) => {
    const prefixMap = {
      admin: 'WACLY-ADM',
      manager: 'WACLY-MNG',
      employee: 'WACLY-EMP'
    };
    
    return sequelize.transaction(async (t) => {
      const [counter] = await Counter.findOrCreate({
        where: { role },
        defaults: { seq: 0 },
        transaction: t
      });
      
      counter.seq += 1;
      await counter.save({ transaction: t });
      
      return `${prefixMap[role]}-${counter.seq.toString().padStart(4, '0')}`;
    });
  };