const app = getApp()

// 判断用户是否有创建打赏



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
    showImg: false
  },
  onShow: function () {
    app.globalData.prev = null
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
  onPullDownRefresh: function () {
    console.log('开始刷新')
    if (this.data.userInfo.m_Name == null) {
      this.getUserInfo()
    }
    wx.stopPullDownRefresh()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var pages = getCurrentPages()
    var currentPage = pages[pages.length - 1]
    var url = currentPage.route
    var tabNum
    console.log('url', url)
    switch(url) {
      case 'pages/list/list':
        tabNum = 2
        break
      case 'pages/index/index':
        tabNum = 1
        break
      case 'pages/code/code':
        tabNum = 0
        break
      default:
        tabNum = 0
        break
    }

    console.log('全局属性', app.globalData)
    this.setData({
      tabNum: tabNum
    })
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = userInfo => {
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        })
        this.isHeadUrl(userInfo)
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
            hasUserInfo: true
          })
          this.isHeadUrl(res.data)
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
      },
      fail: res => {
        console.log('没有本地头像')
        // 先不显示图像以免报错
        this.setData({
          showImg: false
        })

        if (app.globalData.session) {
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
  getUserInfo: function (e) {
    console.log(e)
    if (!e.detail.userInfo) return
    wx.showLoading({
      title: '正在登录中...',
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
            this.isHeadUrl(res.data)
            this.setData({
              userInfo: res.data,
              hasUserInfo: true
            })
            wx.hideLoading()
            console.log(app.globalData.userInfo)
          }
        })
      }
    })
  },
  changeTab: function (e) {
    console.log(e)
    app.globalData.tabNum = e.detail.indexNum
    console.log(app.globalData.tabNum)
  }
})