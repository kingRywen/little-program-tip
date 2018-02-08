const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'), 
    scene: app.globalData.scene,
    tabNum: '',
    showCanvas: 'none',
    bgImg: '',
    showImg: false,
    notUse: false,
    drawImg: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad:  function (options) {

    // 如果存在全局数据，则直接挂上
    if (app.globalData.userInfo) {
      // 判断小程序码，设置数据
      this.getCode('codeImgSrc200', 200)
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
      })
      
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = userInfo => {
        console.log('执行回调', userInfo)
        // 判断小程序码，设置数据
        this.getCode('codeImgSrc200', 200)
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true,
        })
        
      }
    } else {
      app.userInfoReadyCallback = userInfo => {
        console.log('执行回调', userInfo)
        // 判断小程序码，设置数据
        this.getCode('codeImgSrc200', 200)
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true,
        })
      }
      // 如果不能使用getUserInfo
      console.log(app.globalData.userInfo)
      wx.getUserInfo({
        success: res => {
          console.log(res.userInfo)
          app.saveData(res.userInfo)
        }
      })
    }
  },

  onPullDownRefresh: function () {
  },

  onShow: function () {
    app.globalData.prev = null
    wx.getStorage({
      key: 'codeImgSrc',
      success: function (res) {
        console.log(res)
      },
    })
    wx.getStorage({
      key: 'sessionID',
      success: (ses) => {
        wx.request({
          url: 'https://www.drawing-attractions.com/Zan/GetUserBySession',
          data: {
            session: ses.data
          },
          method: 'GET',
          header: {
            'content-type': 'application/json'
          },
          success: res => {

            app.globalData.userInfo = res.data
            this.setData({
              userInfo: res.data
            })
            console.log(app.globalData.userInfo)
          }
        })
      },
    })
  },
  
  getUserInfo: function (e) {
    console.log('user', e.detail, app.globalData.userInfo)
    
    // 并查找小程序码，如果有则直接读取，如果没有要重新生成
    this.getCode('codeImgSrc200', 200)

    if(app.globalData.userInfo) {
      // 如果全局有数据，直接设置userInfo
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else {
      // 如果全局没有userInfo， 说明之前用户拒绝了授权，那么要重新授权并设置app.globalData.userInfo
      
      if (!e.detail.userInfo) { // 如果用户继续阻止授权，弹出提醒
        wx.showModal({
          title: '提示',
          content: '如果不登录将无法使用我们的小程序',
        })
      } else {  // 同意授权，将获取的用户信息存入数据库
        app.saveData(e.detail.userInfo)
      }
    }
  },
  // 小程序码是否有保存，保存就直接用，没保存下载再保存
  /**
   * @str: String  缓存名字
   * @w: Number  小程序码的宽度
   */
  getCode: function (str, w) {
    var url = wx.getStorageSync(str)
    console.log(url)
    if (wx.getFileInfo) {
      wx.getFileInfo({ // storage存了图片，判断图片有没有，如果没有就再下载
        filePath: url,
        success: res => {
          this.setData({
            bgImg: url
          })
        },
        fail: res => {
          this.downloadImg(str, w)
        }
      })
    } else {
      this.downloadImg(str, w)
    }
    
  },
  downloadImg: function (str, w, cl) {
    // 请求下载小程序码图片
    wx.downloadFile({
      url: `https://www.drawing-attractions.com/Zan/GetQRCode?width=${w}&session=${app.globalData.session}&page=pages/client/client`,
      header: {
        'content-type': 'image/jpeg'
      },
      success: res1 => {
        console.log('保存小程序码：', res1.tempFilePath)
        // 保存为固定图片
        wx.saveFile({
          tempFilePath: res1.tempFilePath,
          success: suc => {
            var savedPath = suc.savedFilePath
            console.log(savedPath)
            // 保存图片的路径
            this.setData({
              bgImg: savedPath
            })
            wx.setStorage({
              key: str,
              data: savedPath
            })

            if (cl) {
              cl(savedPath)
            }
          }
        })

      },
      fail: (e) => {
        console.log(e)
        wx.showToast({
          title: '加载失败',
          duration: 2000
        })
      }
    })
  },
  getTemp: function (e) {
    // 设置按钮不可用
    this.setData({
      notUse: true
    })

    wx.showLoading({
      title: '正在生成中...',
      mask: true
    })

    // 开启画布
    this.setData({
      showCanvas: 'block'
    })

    // 查看storage里是否有保存图片路径
    var url = wx.getStorageSync('codeImgSrc')
    console.log(url)
    if (wx.getFileInfo) {
      wx.getFileInfo({ // storage存了图片，判断图片有没有，如果没有就再下载
        filePath: url,
        success: res => {
          this.setData({
            drawImg: url
          })
          this.draw(url)
        },
        fail: res => { // 没有就下载
          this.downloadImg('codeImgSrc', 700, (savedPath) => {
            this.draw(savedPath)
          })
        }
      })
    } else { // 兼容
      this.downloadImg('codeImgSrc', 700, (savedPath) => {
        this.draw(savedPath)
      })
    }
    
  },
  // 画图
  draw: function (path) {
    let self = this
    wx.getStorage({
      key: 'sessionID',
      success: (res) => {
        console.log('提取的路径1', path)
        console.log('头像的路径', this.data.userInfo.m_HeadUrl)
        wx.getImageInfo({
          src: this.data.userInfo.m_HeadUrl,
          success: res => {
            console.log(res)
            let width = res.width,
              height = res.height
            // 画图
            const ctx = wx.createCanvasContext('myCanvas')

            ctx.setFillStyle('white')
            ctx.fillRect(0, 0, 1360, 1360)
            ctx.setFillStyle('black')
            ctx.setFontSize(60)
            ctx.setTextAlign('center')
            ctx.fillText(app.globalData.userInfo.m_Name, 680, 250)
            ctx.setFillStyle('#8d8d8d')
            ctx.setFontSize(38)
            ctx.fillText(app.globalData.userInfo.m_Remark || '非常感谢你的咖啡', 680, 360)
            ctx.beginPath()
            ctx.arc(160, 166, 40, 0, 2 * Math.PI)
            ctx.setFillStyle('#ff645c')
            ctx.fill()
            ctx.beginPath()
            ctx.arc(1143, 480, 25, 0, 2 * Math.PI)
            ctx.setFillStyle('#ff645c')
            ctx.fill()
            ctx.drawImage(path, 330, 490, 700, 700)
            ctx.beginPath()
            ctx.arc(680, 840, 155, 0, 2 * Math.PI)
            ctx.clip()
            if (width < height) {
              // 高的矩形图像,匹配width
              height = 320 / width * height
              width = 320


            } else if (width > height) {
              width = 320 / height * width
              height = 320

            } else {
              width = height = 320
            }
            console.log(width, height)
            ctx.drawImage(this.data.userInfo.m_HeadUrl, 680 - width / 2, 840 - height / 2, width, height)

            // 判断SDK版本，确认是否做ctx.draw兼容

            wx.getSystemInfo({
              success: (res) => {
                console.log(res)
                if (res.SDKVersion < '1.7.4') {
                  console.log('要做兼容')
                  ctx.draw()
                  setTimeout(() => {
                    wx.canvasToTempFilePath({
                      x: 0,
                      y: 0,
                      width: 1360,
                      height: 1360,
                      destWidth: 1360,
                      destHeight: 1360,
                      canvasId: 'myCanvas',
                      success: (res) => {
                        wx.hideLoading()

                        console.log(res.tempFilePath)
                        wx.getSetting({
                          success: ses => {
                            console.log(ses)
                            if (!ses.authSetting['scope.writePhotosAlbum']) {
                              wx.authorize({
                                scope: 'scope.writePhotosAlbum',
                                success() {
                                  wx.saveImageToPhotosAlbum({
                                    filePath: res.tempFilePath,
                                    success(res) {
                                      console.log('保存成功')

                                      wx.showToast({
                                        title: '已成功保存到相册',
                                        icon: 'success',
                                        duration: 2000
                                      })
                                    },
                                    complete: () => {
                                      self.setData({
                                        showCanvas: 'none',
                                        notUse: false
                                      })
                                    }
                                  })
                                }
                              })
                            } else {
                              wx.saveImageToPhotosAlbum({
                                filePath: res.tempFilePath,
                                success(res) {
                                  console.log('保存成功')

                                  wx.showToast({
                                    title: '已成功保存到相册',
                                    icon: 'success',
                                    duration: 2000
                                  })
                                },
                                complete: () => {
                                  self.setData({
                                    showCanvas: 'none',
                                    notUse: false
                                  })
                                }
                              })
                            }
                          }
                        })

                      }
                    })
                  }, 1000)

                } else {
                  ctx.draw(false, () => {
                    console.log('绘制完成')
                    wx.canvasToTempFilePath({
                      x: 0,
                      y: 0,
                      width: 1360,
                      height: 1360,
                      destWidth: 1360,
                      destHeight: 1360,
                      canvasId: 'myCanvas',
                      success: (res) => {
                        wx.hideLoading()

                        console.log(res.tempFilePath)
                        wx.saveImageToPhotosAlbum({
                          filePath: res.tempFilePath,
                          success(res) {

                            console.log('保存成功')

                            wx.showToast({
                              title: '成功保存到相册',
                              icon: 'success',
                              duration: 2000
                            })
                          },
                          complete: () => {
                            self.setData({
                              showCanvas: 'none',
                              notUse: false
                            })
                          }
                        })
                      }
                    })
                  })
                }
              }
            })
          }
        })


      }
    })
  }
  
})