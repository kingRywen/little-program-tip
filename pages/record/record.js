const app = getApp()
var util = require('../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
  
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    earn: '-',
    times: '-',
    showImg: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getZan()
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.data,
          hasUserInfo: true,
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getStorage({
        key: 'sessionID',
        success: function (res1) {
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
              this.globalData.userInfo = res.data
              for (var key in res.data) {
                if (key.indexOf('Money') === 0) money.push(res.data[key])
              }
              this.setData({
                userInfo: res.data,
                hasUserInfo: true,
              })
            }
          })

          
        }
      })

    }
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

  getZan: function () {
    wx.getStorage({
      key: 'sessionID',
      success: (res) => {
        wx.request({
          url: 'https://www.drawing-attractions.com/Zan/GetZanList',
          data: {
            session: res.data
          },
          method: 'GET',
          header: {
            'content-type': 'application/json'
          },
          success: res => {
            console.log(res.data)
            this.getEarn(res.data)
          }
        })
      },
    })
  },

  getEarn: function (lists) {
    let earn = 0
    for(var i=0;i<lists.length; i++) {
      earn += lists[i].Money
      lists[i].day = lists[i].Time.split('T')[0].split('-')[2]
      lists[i].time = lists[i].Time.split('T')[1].split('.')[0]
      lists[i].formatMoney = util.formatMoney(lists[i].Money)
    }
    earn = util.formatMoney(earn)
    this.setData({
      earn,
      times: lists.length,
      lists: lists
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('开始刷新')
    if (this.data.userInfo.m_Name == null) {
      this.getUserInfo()
    }
    this.getZan()
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})