import React from 'react'; // 导入 React 库

// HeatmapDisplay 组件：用于显示页面活动的热力图（当前为模拟版本）
const HeatmapDisplay = () => {
  // 模拟的热力图数据 - 在实际应用中，这些数据将来自用户交互行为的追踪
  // 每个对象代表一个数据点，包含 x, y 坐标和活动强度值 (value)
  const heatmapData = [
    { x: 10, y: 15, value: 5 }, { x: 20, y: 25, value: 2 }, { x: 30, y: 35, value: 8 },
    { x: 50, y: 50, value: 4 }, { x: 100, y: 120, value: 1 }, { x: 150, y: 180, value: 6 }
  ];

  // 热力图容器的内联样式
  const containerStyle = {
    width: '100%', // 宽度占满父容器
    height: '230px', // 高度
    marginTop: '40px', // 与上方评论区的间距
    border: '1px solid rgb(var(--gray-light))', // 边框颜色 (使用主题变量)
    borderRadius: '8px', // 圆角
    backgroundColor: '#fff', // 背景色 (白色)
    padding: '15px', // 内边距
    position: 'relative', // 相对定位，用于内部元素的绝对定位
    boxSizing: 'border-box', // 盒模型设置为 border-box
    boxShadow: 'var(--box-shadow)' // 阴影效果 (使用主题变量)
  };

  // 热力图标题的内联样式
  const titleStyle = {
    textAlign: 'center', // 文本居中
    color: 'rgb(var(--gray-dark))', // 标题颜色 (使用主题变量)
    marginBottom: '15px', // 下外边距
    fontSize: '1.25em' // 字体大小 (相当于 h5)
  };

  // 中文文本定义
  const heatmapTitleText = "页面活动热力图";
  const activityTooltipPrefix = "活跃度"; // 用于数据点悬停提示
  const fallbackLegendText = "(模拟热力图：红点代表活动强度)";


  // FallbackHeatmapVisualization 组件：一个简化的热力图可视化后备方案
  // 由于未能成功集成 react-simple-heatmap 库，使用此组件展示模拟效果
  const FallbackHeatmapVisualization = () => (
    // 可视化区域的容器 div
    <div style={{ 
        width: '100%', 
        height: 'calc(100% - 40px)', // 高度计算，减去标题大致高度
        position: 'relative', // 相对定位
        border: '1px dashed rgb(var(--gray-light))', // 虚线边框
        borderRadius: '4px', // 圆角
        background: 'rgb(var(--gray-light), 0.2)' // 淡背景色
    }}>
      {/* 遍历 heatmapData，为每个数据点渲染一个圆点 */}
      {heatmapData.map(point => (
        <div
          key={`point-${point.x}-${point.y}`} // 设置唯一的 key
          style={{
            position: 'absolute', // 绝对定位
            left: `${(point.x / 200) * 100}%`,  // 根据 x 坐标计算左偏移百分比 (假设最大 x 为 200)
            top: `${(point.y / 200) * 100}%`,   // 根据 y 坐标计算上偏移百分比 (假设最大 y 为 200)
            width: `${point.value * 2.5}px`,    // 圆点宽度，根据活动强度值调整
            height: `${point.value * 2.5}px`,   // 圆点高度
            backgroundColor: `rgba(var(--accent-dark), ${point.value / 10})`, // 背景色，使用主题强调色，透明度根据活动强度调整
            borderRadius: '50%', // 圆形
            transform: 'translate(-50%, -50%)' // 使圆点中心对齐坐标点
          }}
          title={`${activityTooltipPrefix}: ${point.value}`} // 鼠标悬停时显示的提示信息
        />
      ))}
      {/* 模拟热力图的说明文字 */}
      <p style={{
          textAlign: 'center', 
          color: 'rgb(var(--gray))', 
          fontSize: '0.9em', 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)'
      }}>
        {fallbackLegendText}
      </p>
    </div>
  );

  // HeatmapDisplay 组件的返回 JSX
  return (
    // 热力图显示区域的根 div
    <div style={containerStyle}>
      {/* 热力图标题 */}
      <h5 style={titleStyle}>{heatmapTitleText}</h5>
      {/* 渲染后备的热力图可视化组件 */}
      <FallbackHeatmapVisualization />
    </div>
  );
};

export default HeatmapDisplay; // 导出 HeatmapDisplay 组件
