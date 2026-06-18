import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 清理旧数据（按依赖顺序）
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.roleMenu.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  // ===== 权限 =====
  const permissions = await Promise.all([
    prisma.permission.create({ data: { code: "admin", name: "超级管理员" } }),
    prisma.permission.create({ data: { code: "product:list", name: "商品列表" } }),
    prisma.permission.create({ data: { code: "product:create", name: "新增商品" } }),
    prisma.permission.create({ data: { code: "product:update", name: "编辑商品" } }),
    prisma.permission.create({ data: { code: "product:delete", name: "删除商品" } }),
    prisma.permission.create({ data: { code: "order:list", name: "订单列表" } }),
    prisma.permission.create({ data: { code: "order:detail", name: "订单详情" } }),
    prisma.permission.create({ data: { code: "order:ship", name: "订单发货" } }),
    prisma.permission.create({ data: { code: "user:list", name: "用户列表" } }),
    prisma.permission.create({ data: { code: "user:create", name: "新增用户" } }),
    prisma.permission.create({ data: { code: "user:update", name: "编辑用户" } }),
    prisma.permission.create({ data: { code: "role:list", name: "角色列表" } }),
    prisma.permission.create({ data: { code: "role:create", name: "新增角色" } }),
    prisma.permission.create({ data: { code: "role:update", name: "编辑角色" } }),
  ]);

  // ===== 角色 =====
  const [adminRole, editorRole, guestRole] = await Promise.all([
    prisma.role.create({ data: { name: "admin", label: "管理员", status: 1 } }),
    prisma.role.create({ data: { name: "editor", label: "编辑", status: 1 } }),
    prisma.role.create({ data: { name: "guest", label: "访客", status: 1 } }),
  ]);

  // 管理员拥有全部权限
  await Promise.all(
    permissions.map((p) =>
      prisma.rolePermission.create({
        data: { roleId: adminRole.id, permissionId: p.id },
      })
    )
  );

  // 编辑拥有商品和订单权限
  const editorPerms = permissions.filter((p) =>
    p.code.startsWith("product:") || p.code.startsWith("order:") || p.code.endsWith(":list")
  );
  await Promise.all(
    editorPerms.map((p) =>
      prisma.rolePermission.create({
        data: { roleId: editorRole.id, permissionId: p.id },
      })
    )
  );

  // 访客只有查看权限
  const guestPerms = permissions.filter((p) => p.code.endsWith(":list") || p.code === "order:detail");
  await Promise.all(
    guestPerms.map((p) =>
      prisma.rolePermission.create({
        data: { roleId: guestRole.id, permissionId: p.id },
      })
    )
  );

  // ===== 菜单（先建父菜单，再建子菜单，避免外键冲突）=====
  const [dashboardMenu, productMenu, orderMenu, systemMenu] = await Promise.all([
    prisma.menu.create({ data: { name: "概览", path: "/dashboard", icon: "DashboardOutlined", sort: 1 } }),
    prisma.menu.create({ data: { name: "商品管理", path: "/product", icon: "ShoppingOutlined", sort: 2, permission: "product:list" } }),
    prisma.menu.create({ data: { name: "订单管理", path: "/order", icon: "OrderedListOutlined", sort: 3, permission: "order:list" } }),
    prisma.menu.create({ data: { name: "系统管理", path: "/system", icon: "SettingOutlined", sort: 99 } }),
  ]);

  const systemChildren = await Promise.all([
    prisma.menu.create({ data: { name: "用户管理", path: "/system/user", icon: "UserOutlined", sort: 1, parentId: systemMenu.id, permission: "user:list" } }),
    prisma.menu.create({ data: { name: "角色管理", path: "/system/role", icon: "TeamOutlined", sort: 2, parentId: systemMenu.id, permission: "role:list" } }),
    prisma.menu.create({ data: { name: "菜单管理", path: "/system/menu", icon: "MenuOutlined", sort: 3, parentId: systemMenu.id } }),
  ]);

  const menus = [dashboardMenu, productMenu, orderMenu, systemMenu, ...systemChildren];

  // 管理员可以看全部菜单
  await Promise.all(
    menus.map((m) =>
      prisma.roleMenu.create({ data: { roleId: adminRole.id, menuId: m.id } })
    )
  );

  // 编辑器只看商品和订单
  const editorMenus = menus.filter((m) =>
    m.path?.startsWith("/product") || m.path?.startsWith("/order") || m.path === "/dashboard"
  );
  await Promise.all(
    editorMenus.map((m) =>
      prisma.roleMenu.create({ data: { roleId: editorRole.id, menuId: m.id } })
    )
  );

  // 访客只看商品
  const guestMenus = menus.filter((m) =>
    m.path?.startsWith("/product") || m.path === "/dashboard"
  );
  await Promise.all(
    guestMenus.map((m) =>
      prisma.roleMenu.create({ data: { roleId: guestRole.id, menuId: m.id } })
    )
  );

  // ===== 测试用户 =====
  const hashedPassword = await bcrypt.hash("123456", 10);
  const admin = await prisma.user.create({
    data: { username: "admin", email: "admin@adminflow.com", password: hashedPassword, status: 1 },
  });
  const editor = await prisma.user.create({
    data: { username: "editor", email: "editor@adminflow.com", password: hashedPassword, status: 1 },
  });
  const guest = await prisma.user.create({
    data: { username: "guest", email: "guest@adminflow.com", password: hashedPassword, status: 1 },
  });

  await Promise.all([
    prisma.userRole.create({ data: { userId: admin.id, roleId: adminRole.id } }),
    prisma.userRole.create({ data: { userId: editor.id, roleId: editorRole.id } }),
    prisma.userRole.create({ data: { userId: guest.id, roleId: guestRole.id } }),
  ]);

  // ===== 分类和示例商品 =====
  const [cateElectronics, cateClothing, cateFood, cateHome, cateSports] = await Promise.all([
    prisma.category.create({ data: { name: "电子产品", sort: 1 } }),
    prisma.category.create({ data: { name: "服装", sort: 2 } }),
    prisma.category.create({ data: { name: "食品饮料", sort: 3 } }),
    prisma.category.create({ data: { name: "家居用品", sort: 4 } }),
    prisma.category.create({ data: { name: "运动户外", sort: 5 } }),
  ]);

  const allProducts = [
    // 电子产品
    { name: "iPhone 15", description: "Apple iPhone 15 128GB A16芯片", price: 5999, stock: 100, categoryId: cateElectronics.id, images: "[]" },
    { name: "MacBook Pro", description: "14英寸 M3 Pro芯片 18GB内存 512GB存储", price: 14999, stock: 50, categoryId: cateElectronics.id, images: "[]" },
    { name: "iPad Air", description: "M2芯片 11英寸 Liquid Retina显示屏 128GB", price: 4799, stock: 60, categoryId: cateElectronics.id, images: "[]" },
    { name: "AirPods Pro", description: "主动降噪 自适应音频 USB-C接口 H2芯片", price: 1899, stock: 120, categoryId: cateElectronics.id, images: "[]" },
    { name: "Apple Watch S9", description: "45mm GPS款 全天候视网膜显示屏 运动手环", price: 2999, stock: 80, categoryId: cateElectronics.id, images: "[]" },
    { name: "机械键盘 K8 Pro", description: "无线蓝牙 热插拔 Gasket结构 87键 RGB背光", price: 399, stock: 200, categoryId: cateElectronics.id, images: "[]" },
    { name: "27英寸4K显示器", description: "IPS面板 Type-C 65W反向充电 HDR400 旋转升降支架", price: 2499, stock: 45, categoryId: cateElectronics.id, images: "[]" },
    // 服装
    { name: "纯棉T恤", description: "纯棉圆领短袖 宽松版型 多色可选", price: 99, stock: 500, categoryId: cateClothing.id, images: "[]" },
    { name: "修身牛仔裤", description: "弹力棉质 经典五袋款 中腰修身版型", price: 259, stock: 300, categoryId: cateClothing.id, images: "[]" },
    { name: "复古运动鞋", description: "网面透气 缓震中底 百搭复古款 多色可选", price: 459, stock: 250, categoryId: cateClothing.id, images: "[]" },
    { name: "连帽卫衣", description: "加绒保暖 纯棉面料 宽松落肩 简约字母印花", price: 199, stock: 180, categoryId: cateClothing.id, images: "[]" },
    // 食品饮料
    { name: "混合坚果礼盒", description: "每日坚果 6种混合 500g罐装 无添加 原味烘焙", price: 89, stock: 500, categoryId: cateFood.id, images: "[]" },
    { name: "有机绿茶200g", description: "明前采摘龙井 精致罐装 清香回甘 特级绿茶", price: 128, stock: 400, categoryId: cateFood.id, images: "[]" },
    // 家居用品
    { name: "简约护眼台灯", description: "LED护眼 三档色温 无极调光 USB充电 触摸开关", price: 149, stock: 150, categoryId: cateHome.id, images: "[]" },
    { name: "记忆棉坐垫", description: "久坐不累 办公室椅垫 透气面料 防滑底部 加厚款", price: 79, stock: 220, categoryId: cateHome.id, images: "[]" },
    // 运动户外
    { name: "加厚瑜伽垫", description: "TPE材质 双面防滑 6mm加厚 含收纳绑带 初学者适用", price: 99, stock: 300, categoryId: cateSports.id, images: "[]" },
    { name: "保温运动水壶", description: "不锈钢保温 双层真空 750ml 24小时保冷保热 不含BPA", price: 119, stock: 350, categoryId: cateSports.id, images: "[]" },
  ];

  for (const p of allProducts) {
    await prisma.product.create({ data: p });
  }

  console.log("✅ 种子数据创建完成");
  console.log("   管理员: admin / 123456");
  console.log("   编辑:   editor / 123456");
  console.log("   访客:   guest / 123456");
  console.log("   商品:   " + allProducts.length + " 件 / 5 个分类");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
