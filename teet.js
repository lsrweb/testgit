// 难以阅读的深度嵌套
function processOrder(order) {
    if (order) {
        if (order.status === 'pending') {
            if (order.amount > 0) {
                if (order.user) {
                    if (order.user.isVip) {
                        if (order.amount > 1000) {
                            // 深层嵌套的逻辑
                        }
                    }
                } else {

                }
            }
        } else {
          if (order.status === 'completed') {
            if (order.amount > 500) {
                // 处理已完成的订单
            } else {
                // 处理已完成但金额不足的订单
            }
          }
        }
    } else {
        return ;
    }
}

// ==> 优化
function processOrder(order) {
  // 卫语句：提前返回，减少嵌套
  if (!order) return;
  if (order.amount <= 0) return;
  
  // 策略模式：根据订单状态处理
  const orderStrategies = {
    pending: (order) => handlePendingOrder(order),
    completed: (order) => handleCompletedOrder(order)
  };
  
  const strategy = orderStrategies[order.status];
  if (strategy) {
    strategy(order);
  }
}

function handlePendingOrder(order) {
  // 卫语句：提前返回
  if (!order.user) return;
  if (!order.user.isVip) return;
  if (order.amount <= 1000) return;
  
  // 深层嵌套的逻辑
  console.log('处理VIP大额待处理订单');
}

function handleCompletedOrder(order) {
  if (order.amount > 500) {
    // 处理已完成的订单
    console.log('处理已完成的大额订单');
  } else {
    // 处理已完成但金额不足的订单
    console.log('处理已完成的小额订单');
  }
}

// 重复代码
function getDiscount(userType) {
    if (userType === 'vip') {
        // 相似的折扣计算逻辑
        return calculateVipDiscount();
    } else if (userType === 'member') {
        // 相似的折扣计算逻辑
        return calculateMemberDiscount();
    } else if (userType === 'guest') {
        // 相似的折扣计算逻辑
        return calculateGuestDiscount();
    }
}


// 策略模式优点
// 1. 高可扩展性
// 2. 符合开闭原则
// 3. 代码复用性强
// 4. 单一职责原则
// 性能对比 O(n) vs O(1)
function getDiscount(userType) {
    const discountStrategies = {
        vip: calculateVipDiscount,
        member: calculateMemberDiscount,
        guest: calculateGuestDiscount
    };
    
    const discountFunction = discountStrategies[userType];
    if (discountFunction) {
        return discountFunction();
    }
    
    return 0; // 默认折扣
}



// 哈希查找相比线性查找的主要优势：

// 时间效率：O(1) vs O(n)
// 扩展性好：数据量增加不影响查找速度
// 代码简洁：避免长长的if-else链

// 但也有代价：

// 空间开销：需要额外的存储空间
// 适用范围：只适合简单的键值映射
// 哈希冲突：在极端情况下可能退化为线性查找
