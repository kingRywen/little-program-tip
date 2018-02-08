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
    showImg: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad:  function (options) {
    console.log('全局属性', app.globalData)

    // 如果存在全局数据，则直接挂上
    if (app.globalData.userInfo) {
      console.log('1')
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
      })
      this.isHeadUrl(app.globalData.userInfo)
      this.getCode()
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = userInfo => {
        console.log('执行回调', userInfo)
        this.isHeadUrl(userInfo)
        this.getCode()
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true,
        })
        
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.request({
        url: 'https://www.drawing-attractions.com/Zan/GetUserBySession',
        data: {
          session: res1.data
        },
        method: 'GET',
        header: {
          'content-type': 'application/json'
        },
        success: res => {
          this.setData({
            userInfo: res.data,
            hasUserInfo: true,
          })
          this.isHeadUrl(userInfo)
          this.getCode()
        }
      })
      
    }
    
  },
  // 判断是否有本地头像，没有就下载
  isHeadUrl: function (userInfo) {
    let self = this
    wx.getFileInfo({
      filePath: userInfo.m_HeadUrl,
      success: res => {
        console.log('本地头像', res)
        this.setData({
          showImg: true
        })
      },
      fail: res => {
        console.log('没有本地头像')
        // 先不显示图像以免报错
        this.setData({
          showImg: false
        })

        if (app.globalData.session) {
          console.log('下载')
          // 下载头像
          self.downloadHead(app.globalData.session)
        } else {
          console.log('没有session')
        }
      }
    })
  },
  downloadHead: function (session) {
    wx.downloadFile({
      url: 'https://www.drawing-attractions.com/Zan/DownloadHeadImage?session=' + session,
      header: {
        'content-type': 'image/jpeg'
      },
      success: res => {

        wx.saveFile({
          tempFilePath: res.tempFilePath,
          success: res => {
            var userInfo = app.globalData.userInfo
            userInfo.m_HeadUrl = res.savedFilePath
            console.log(app.globalData.userInfo)
            this.setData({
              userInfo: userInfo,
              showImg: true
            })

            // 并更新数据库
            wx.request({
              url: 'https://www.drawing-attractions.com/Zan/UpdateFun',
              method: 'POST',
              header: {
                'content-type': 'application/json' // 默认值
              },
              data: {
                Money1: userInfo.Money1,
                Money2: userInfo.Money2,
                Money3: userInfo.Money3,
                Money4: userInfo.Money4,
                Money5: userInfo.Money5,
                m_Name: userInfo.m_Name,
                m_HeadUrl: userInfo.m_HeadUrl,
                m_Remark: userInfo.m_Remark,
                session: session,
              },
              success: (res) => {
                console.log('全局更新', res)
              },
              fail: () => {
                wx.showToast({
                  title: '头像加载失败',
                  icon: 'none',
                  duration: 2000
                })
              }
            })
          }
        })
      }
    })
  },
  onPullDownRefresh: function () {
    console.log('开始刷新')
    if(this.data.userInfo.m_Name == null) {
      this.getUserInfo()
    }
    if(!this.data.bgImg) {
      this.getCode()
    }
    wx.stopPullDownRefresh()
  },
  // 获取小程序码
  getCode: function () {
    wx.showLoading({
      title: '载入中...',
      mask: true
    })
    wx.getStorage({
      key: 'codeImgSrc',
      success: (res) => {
        // 如果storage里存有二维码地址
        console.log('getCode', res)
        wx.getFileInfo({
          filePath: res.data,
          success: r => {
            console.log(r.size)
            wx.hideLoading()
            this.setData({
              bgImg: res.data
            })
          },
          fail: res => {
            console.log('失败')
            this.getFirstTemp()
          }
        })
        
      },
      fail: err => {
        // 没有存就再生成一个
        console.log('getCode', err)
        this.getFirstTemp()
      }
    })
  },
  onShow: function () {
    app.globalData.prev = null
    wx.getStorage({
      key: 'codeImgSrc',
      success: function(res) {
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
    console.log(e)
    if (!e.detail.userInfo) return
    // app.globalData.userInfo = e.detail.userInfo
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
            this.isHeadUrl(res.data)
            this.getFirstTemp()
            console.log(app.globalData.userInfo)
          }
        })
      }
    })
    app.globalData.isAuth = true
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true,
      isAuth: true
    })
  },
  changeTab: function (e) {
    console.log(e)
    app.globalData.tabNum = e.detail.indexNum
    console.log(app.globalData.tabNum)
  },
  getFirstTemp: function (fn) {
    wx.showLoading({
      title: '载入中...',
      mask: true
    })
    // 请求小程序码
    wx.getStorage({
      key: 'sessionID',
      success: (res) => {
        wx.downloadFile({
          url: `https://www.drawing-attractions.com/Zan/GetQRCode?width=700&session=${res.data}&page=pages/client/client`,
          header: {
            'content-type': 'image/jpeg'
          },
          success: res1 => {
            console.log('保存小程序码：', res1.tempFilePath)
            wx.saveFile({
              tempFilePath: res1.tempFilePath,
              success: suc => {
                var savedPath = suc.savedFilePath
                console.log(savedPath)
                this.setData({
                  bgImg: savedPath
                })
                wx.hideLoading()
                wx.setStorage({
                  key: 'codeImgSrc',
                  data: savedPath
                })
                if (fn) fn(savedPath)
              }
            })
            
          },
          fail: (e) => {
            console.log(e)
            wx.showToast({
              title: '失败' + JSON.stringify(e),
              duration: 2000
            })
          }
        })
      }
    })
  },
  getTemp: function () {
    var self = this
    wx.showLoading({
      title: '正在生成中...',
      mask: true
    })

    this.setData({
      showCanvas: 'block'
    })

    // 请求小程序码
    wx.getStorage({
      key: 'codeImgSrc',
      success: (path) => {
        this.draw(path.data)
      },
      fail: res => {
        wx.showLoading({
          title: '加载中...',
          mask: true
        })
        console.log(this.draw)
        this.getFirstTemp(this.draw)

      }
    })
  },
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
            if(width < height) {
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
            ctx.drawImage(this.data.userInfo.m_HeadUrl, 680 - width/2, 840 - height/2, width, height)

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
                                        showCanvas: 'none'
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
                                    showCanvas: 'none'
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
                              showCanvas: 'none'
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