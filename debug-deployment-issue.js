const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// 部署问题诊断配置
const config = {
  projectName: 'axi-project-dashboard',
  buildArtifactName: 'dist-axi-project-dashboard',
  expectedFiles: [
    'package.json',
    'ecosystem.config.js',
    'start.sh',
    'backend/index.js',
    'frontend/index.html'
  ]
};

// 执行命令并返回结果
async function runCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, output: stdout, error: stderr };
  } catch (error) {
    return { success: false, output: error.stdout, error: error.stderr };
  }
}

// 检查构建产物
async function checkBuildArtifact() {
  console.log('🔍 检查构建产物...\n');
  
  // 检查dist目录是否存在
  const distCheck = await runCommand('ls -la dist/');
  if (distCheck.success) {
    console.log('✅ dist目录存在');
    console.log(distCheck.output);
  } else {
    console.log('❌ dist目录不存在');
  }
  
  console.log('');
  
  // 检查构建产物内容
  const contentCheck = await runCommand('find dist/ -type f | head -20');
  if (contentCheck.success) {
    console.log('📁 构建产物内容:');
    console.log(contentCheck.output);
  }
  
  console.log('');
  
  // 检查关键文件
  for (const file of config.expectedFiles) {
    const fileCheck = await runCommand(`ls -la dist/${file}`);
    if (fileCheck.success) {
      console.log(`✅ ${file} 存在`);
    } else {
      console.log(`❌ ${file} 不存在`);
    }
  }
  
  console.log('');
}

// 检查GitHub Actions日志
async function checkGitHubActions() {
  console.log('🔍 检查GitHub Actions状态...\n');
  
  // 检查最近的workflow运行
  const workflowCheck = await runCommand('gh run list --limit 5');
  if (workflowCheck.success) {
    console.log('📋 最近的workflow运行:');
    console.log(workflowCheck.output);
  } else {
    console.log('❌ 无法获取workflow运行列表');
  }
  
  console.log('');
}

// 检查构建产物大小
async function checkBuildSize() {
  console.log('📊 检查构建产物大小...\n');
  
  const sizeCheck = await runCommand('du -sh dist/');
  if (sizeCheck.success) {
    console.log('构建产物大小:');
    console.log(sizeCheck.output);
  }
  
  console.log('');
  
  // 检查各个目录大小
  const dirs = ['dist/backend', 'dist/frontend', 'dist/node_modules'];
  for (const dir of dirs) {
    const dirCheck = await runCommand(`du -sh ${dir} 2>/dev/null || echo "目录不存在"`);
    if (dirCheck.success) {
      console.log(`${dir} 大小: ${dirCheck.output.trim()}`);
    }
  }
  
  console.log('');
}

// 检查部署配置
async function checkDeployConfig() {
  console.log('⚙️ 检查部署配置...\n');
  
  // 检查ecosystem.config.js
  const ecosystemCheck = await runCommand('cat ecosystem.config.js | head -20');
  if (ecosystemCheck.success) {
    console.log('ecosystem.config.js 配置:');
    console.log(ecosystemCheck.output);
  }
  
  console.log('');
  
  // 检查package.json
  const packageCheck = await runCommand('cat package.json | grep -E "(name|version|scripts)"');
  if (packageCheck.success) {
    console.log('package.json 关键信息:');
    console.log(packageCheck.output);
  }
  
  console.log('');
}

// 检查文件权限
async function checkFilePermissions() {
  console.log('🔐 检查文件权限...\n');
  
  const permCheck = await runCommand('ls -la dist/start.sh dist/ecosystem.config.js 2>/dev/null || echo "文件不存在"');
  if (permCheck.success) {
    console.log('关键文件权限:');
    console.log(permCheck.output);
  }
  
  console.log('');
}

// 检查依赖完整性
async function checkDependencies() {
  console.log('📦 检查依赖完整性...\n');
  
  // 检查node_modules
  const nodeModulesCheck = await runCommand('ls -la dist/node_modules/ | head -10');
  if (nodeModulesCheck.success) {
    console.log('node_modules 内容:');
    console.log(nodeModulesCheck.output);
  } else {
    console.log('❌ node_modules 不存在或为空');
  }
  
  console.log('');
  
  // 检查关键依赖
  const criticalDeps = ['express', 'pm2', 'socket.io'];
  for (const dep of criticalDeps) {
    const depCheck = await runCommand(`ls -la dist/node_modules/${dep}/ 2>/dev/null || echo "依赖不存在"`);
    if (depCheck.success && !depCheck.output.includes('依赖不存在')) {
      console.log(`✅ ${dep} 依赖存在`);
    } else {
      console.log(`❌ ${dep} 依赖不存在`);
    }
  }
  
  console.log('');
}

// 检查构建产物结构
async function checkBuildStructure() {
  console.log('🏗️ 检查构建产物结构...\n');
  
  const structureCheck = await runCommand('tree dist/ -L 3 2>/dev/null || find dist/ -type d | head -20');
  if (structureCheck.success) {
    console.log('构建产物目录结构:');
    console.log(structureCheck.output);
  }
  
  console.log('');
}

// 主诊断函数
async function runDiagnosis() {
  console.log('🚀 开始部署问题诊断...\n');
  
  await checkBuildArtifact();
  await checkBuildSize();
  await checkDeployConfig();
  await checkFilePermissions();
  await checkDependencies();
  await checkBuildStructure();
  await checkGitHubActions();
  
  console.log('📋 诊断建议:');
  console.log('1. 检查构建产物是否完整');
  console.log('2. 验证关键文件是否存在');
  console.log('3. 确认文件权限是否正确');
  console.log('4. 检查依赖是否完整');
  console.log('5. 验证部署配置是否正确');
  console.log('');
  console.log('🔧 可能的解决方案:');
  console.log('- 重新运行构建工作流');
  console.log('- 检查GitHub Actions日志');
  console.log('- 验证构建产物上传');
  console.log('- 检查部署配置参数');
  console.log('- 确认服务器连接状态');
  console.log('');
  console.log('💡 常见问题:');
  console.log('- 构建产物不完整');
  console.log('- 文件权限问题');
  console.log('- 依赖缺失');
  console.log('- 配置错误');
  console.log('- 网络连接问题');
}

// 运行诊断
runDiagnosis().catch(console.error);
