import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Prisma IPC Handlers
  ipcMain.handle('get-products', async () => {
    return await prisma.product.findMany({ include: { variants: true } })
  })

  ipcMain.handle('create-product', async (_, productData) => {
    // If no variants provided, create a default one so it can be sold
    const variants = productData.variants && productData.variants.length > 0 
      ? productData.variants 
      : [{ sku: `${productData.name.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`, size: 'Standard', color: 'Any', stock: 100 }]
      
    return await prisma.product.create({
      data: {
        name: productData.name,
        category: productData.category,
        basePrice: productData.basePrice,
        variants: {
          create: variants
        }
      }
    })
  })

  ipcMain.handle('update-product', async (_, productData) => {
    return await prisma.product.update({
      where: { id: productData.id },
      data: {
        name: productData.name,
        category: productData.category,
        basePrice: productData.basePrice,
      }
    })
  })

  ipcMain.handle('delete-product', async (_, productId) => {
    return await prisma.$transaction([
      prisma.productVariant.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } })
    ])
  })

  ipcMain.handle('create-order', async (_, orderData) => {
    // OrderData: { cashierId, paymentType, items: [{ variantId, quantity, priceAtTime }] }
    
    // Fallback if no cashier is logged in (for testing)
    let actualCashierId = orderData.cashierId
    if (!actualCashierId) {
      const firstUser = await prisma.user.findFirst()
      if (firstUser) actualCashierId = firstUser.id
    }

    return await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      
      for (const item of orderData.items) {
        totalAmount += item.priceAtTime * item.quantity;
        // Deduct stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } }
        })
      }

      const order = await tx.order.create({
        data: {
          totalAmount,
          paymentType: orderData.paymentType,
          cashier: { connect: { id: actualCashierId } },
          items: {
            create: orderData.items.map((i: any) => ({
              productVariant: { connect: { id: i.variantId } },
              quantity: i.quantity,
              priceAtTime: i.priceAtTime
            }))
          }
        }
      })
      return order;
    })
  })

  ipcMain.handle('get-stats', async () => {
    const today = new Date()
    today.setHours(0,0,0,0)

    const todayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: today } }
    })
    
    const todaysSales = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalOrders = todayOrders.length

    return { todaysSales, totalOrders }
  })

  ipcMain.handle('get-employees', async () => {
    return await prisma.user.findMany()
  })

  ipcMain.handle('create-employee', async (_, employeeData) => {
    return await prisma.user.create({
      data: employeeData
    })
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

