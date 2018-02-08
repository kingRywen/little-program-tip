//app.js
App({
  onLaunch: function (options) {

    // 获取微信版本信息
    var res = wx.getSystemInfoSync()
    this.globalData.SDKVersion = res.SDKVersion

    // if (res.SDKVersion < '1.4.0') {
    //   wx.showModal({
    //     title: '提示',
    //     content: '当前微信版本过低，无法使用小程序，请升级到最新微信版本后重试。',
    //   })
    //   return
    // }

    // 判断用户是否登录过期
    wx.checkSession({

      success: () => {
        // 用户登录没有过期
        console.log('用户没有过期')

        // 检查是否有session
        if (!this.globalData.session) {
          // 没有session, 重新登录获取session
          this.login()
        } else {
          // 直接获取用户信息
          this.getUserSettings()
        }
      },
      
      fail: () => {
        // 用户登录已过期,需要重新登录
        console.log('用户已过期')
        this.login()
      }
    })
  },
  // 登录
  login: function () {
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
    wx.login({
      success: res => {
        // 登录后使用code与本地服务器换取session
        wx.request({
          url: 'https://www.drawing-attractions.com/Zan/GetSession',
          data: {
            code: res.code
          },
          method: 'POST',
          header: {
            'content-type': 'application/json'
          },
          success: (res) => {
            console.log('获取session', res.data)
            // 存入session
            this.globalData.session = res.data
            wx.setStorage({
              key: 'sessionID',
              data: res.data,
            })

            // 开始获取用户信息
            this.getUserSettings()
          }
        })
      }
    })
  },
  // 获取用户信息
  getUserSettings: function () {
    // 获取用户的当前授权设置
    wx.getSetting({
      success: (res) => {
        // 用户如果之前没有同意授权，调用授权窗口让用户同意
        if (!res.authSetting['scope.userInfo']) {
          wx.authorize({
            scope: 'scope.userInfo',
            success: () => {
              // 用户已经同意，后续调用不会弹窗询问，获取信息存入数据库
              wx.getUserInfo({
                success: (res) => {
                  console.log(res.userInfo)
                  this.saveData(res.userInfo)
                }
              })
            },
            fail: () => {
              // 用户没有同意授权，后续可以通过点击登录再次授权
              console.log('fail')
            }
          })
        } else {
          // 之前同意授权，直接获取信息并存入数据库
          wx.getUserInfo({
            success: (res) => {
              console.log(res.userInfo)
              this.saveData(res.userInfo)
            }
          })
        }
      },
      complete: function () {
        
      }
    })
  },
  // 获取信息后将个人信息存入后台数据库
  saveData: function ({ nickName, avatarUrl, gender, city, province, country, language}) {
    // post提交数据
    console.log(nickName, avatarUrl, gender, city, province, country, language)
    wx.request({
      url: 'https://www.drawing-attractions.com/Zan/UpdateInfo',
      data: {
        session: this.globalData.session,
        nickName,
        avatarUrl,
        gender,
        city,
        province,
        country,
        language
      },
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('存储个人信息成功')
        // 判断是否有更新过个人信息，如果有，则替换成更新后的信息
        this.update()
      }
    })
  },
  // 判断是否有更新过个人信息
  update: function () {
    // 从本地数据库获取用户信息
    wx.request({
      url: 'https://www.drawing-attractions.com/Zan/GetUserBySession',
      data: {
        session: this.globalData.session
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        console.log(res)
        // 获取到用户的信息，判断本地有没有头像
        this.isHeadImg(res.data)
      }
    })
  },
  // 判断本地有没有头像
  isHeadImg: function (data) {
    if (wx.getFileInfo) { // 兼容
      wx.getFileInfo({
        filePath: data.m_HeadUrl,
        success: res => {
          // 有本地头像
          console.log('有本地头像', data.m_HeadUrl)
          this.sureData(data)
        },
        fail: res => {
          // 没有本地头像
          console.log('没有本地头像', this.globalData.session, data)
          // 下载头像
          this.downloadHead(this.globalData.session, data)
        }
      })
    } else { // 兼容 不判断有没有头像，直接下载头像
      this.downloadHead(this.globalData.session, data)
    }
  },
  // 下载头像
  downloadHead: function (session, data) {
    // 下载为临时文件
    wx.downloadFile({
      url: 'https://www.drawing-attractions.com/Zan/DownloadHeadImage?session=' + session,
      header: {
        'content-type': 'image/jpeg'
      },
      success: res => {
        // 临时文件下载完后存为固定文件
        wx.saveFile({
          tempFilePath: res.tempFilePath,
          success: res => {
            var userInfo = data
            console.log('userInfo', userInfo)
            // 下载完后存入userInfo
            console.log(res.savedFilePath)
            userInfo.m_HeadUrl = res.savedFilePath

            this.sureData(userInfo)

            // 更新数据库的图片地址
            this.updateImgUrl(userInfo)

          },
          fail: function (e) {
            console.log('app.js下载头像失败', e)
            wx.getSavedFileList({
              success: res => {
                console.log(res.fileList)
                var files = res.fileList
                files.map((path, i) => {
                  wx.removeSavedFile({
                    filePath: path,
                    complete: (res) => {
                      this.downloadHead(session, data)
                    }
                  })

                })
              }
            })
          }
        })
      }
    })
  },
  // 确认数据获取完之后的操作
  sureData: function (data) {
    // 把正确数据设置到globalData
    this.globalData.userInfo = data

    // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    // 所以此处加入 callback 以防止这种情况
    if (this.userInfoReadyCallback) {
      console.log('page先加载完')
      this.userInfoReadyCallback(this.globalData.userInfo)
    }
    wx.hideLoading()
  },

  // 图片下载完后更新图片数据库地址
  updateImgUrl: function (userInfo) {
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
        session: this.globalData.session,
      },
      success: (res) => {
        console.log('更新图片地址成功', res)
      },
      fail: () => {
        wx.showToast({
          title: '头像加载失败，下拉再试',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  globalData: {
    userInfo: null,
    pixelRatio: 0,
    scene: null,
    tabNum: 0,
    prev: null,
    session: null,
    headUrl: null,
    SDKVersion: null
  }
})