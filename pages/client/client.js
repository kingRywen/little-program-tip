//index.js
//获取应用实例
const app = getApp()


Page({
  data: {
    pixelRatio: app.globalData.pixelRatio || 2,
    scene: null,
    nowIndex: 0,
    money: [0,0,0,0,0],
    inputMoneyNum: '其它金额',
    userInfo: {},
    hasUserInfo: false,
    payNum: '',
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    tabNum: ''
  },
  //事件处理函数
  bindViewTap: function() {
  },
  onUnload: function () {
    if(this.data.userInfo.status == 2) {
      app.globalData.prev = true
    }
  },
  onLoad: function (options) {
    console.log('options', options)
    this.setData({
      scene: options.uid
    })
    // 自己的码
    if(options.prev == 1) {
      
      console.log(options)
      let { headurl, money, name, remark } = options
      money = money.split('/')
      let userInfo = {
        m_HeadUrl: headurl,
        m_Name: name,
        m_Remark: remark == 'null'? null : remark,
        status: 2
      }
      this.setData({
        hasUserInfo: true,
        canIUse: true,
        userInfo,
        money
      })
    } else {
      console.log('别人的码')
      wx.showLoading({
        title: '载入中...',
        mask: true
      })
      if (app.globalData.userInfo) {
        console.log(0)
        this.getMan()
        wx.hideToast()
      } else if (this.data.canIUse) {
        // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        // 所以此处加入 callback 以防止这种情况
        console.log('1')
        app.userInfoReadyCallback = res => {
          this.getMan()
          wx.hideToast()
        }
      } else {
        console.log('2')
        // 在没有 open-type=getUserInfo 版本的兼容处理
        this.getMan()
        wx.hideToast()
      }
    }
  },
  getMan: function () {
    wx.getStorage({
      key: 'sessionID',
      success: (ses) => {
        wx.request({
          url: 'https://www.drawing-attractions.com/Zan/GetUserByUid',
          data: {
            session: ses.data,
            uid: this.data.scene
          },
          method: 'GET',
          header: {
            'content-type': 'application/json'
          },
          success: res1 => {
            // 获取被扫码人的头像
            wx.downloadFile({
              url: 'https://www.drawing-attractions.com/Zan/DownloadHeadImage2?uid=' + this.data.scene,
              header: {
                'content-type': 'image/jpeg'
              },
              success: res => {
                console.log(res)
                wx.saveFile({
                  tempFilePath: res.tempFilePath,
                  success: res => {
                    let money = []
                    console.log('保存头像', res)
                    for (var key in res1.data) {
                      if (key.indexOf('Money') === 0) money.push(res1.data[key])
                    }
                    let userInfo = {}
                    userInfo.m_HeadUrl = res.savedFilePath
                    userInfo.m_Name = res1.data.m_Name
                    userInfo.m_Remark = res1.data.m_Remark
                    userInfo.status = res1.data.status
                    this.setData({
                      money: money,
                      userInfo: userInfo,
                      payNum: money[0],
                      hasUserInfo: true
                    })
                    wx.stopPullDownRefresh()
                  }
                })
                
              }
            })

            
          },
          fail: e => {
            wx.showToast({
              title: JSON.stringify(e),
              duration: 3000
            })
          }
        })
      },
    })
  },
  onPullDownRefresh: function () {
    console.log('开始刷新', this.data.userInfo.m_Name)
    if (this.data.userInfo.m_Name != null) {
      wx.stopPullDownRefresh()
      return
    }
    this.getMan()
  },
  getUserInfo: function(e) {
    console.log(e)
    if(!e.detail.userInfo) return
    // app.globalData.userInfo = e.detail.userInfo
    wx.showLoading({
      title: '正在登录中...',
      mask: true
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
            var money = []
            for (var key in app.globalData.userInfo) {
              if (key.indexOf('Money') === 0) money.push(app.globalData.userInfo[key])
            }
            this.setData({
              userInfo: res.data,
              money: money
            })
            wx.hideLoading()
            console.log(app.globalData.userInfo)
          }
        })
      },
      fail: res => {
        
      }
    })
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  payMoney: function() {
    console.log('支付' + this.data.payNum)
    wx.getStorage({
      key: 'sessionID',
      success: (res) => {
        wx.request({
          url: 'https://www.drawing-attractions.com/Zan/GetPayInfo',
          data: {
            Money: (this.data.payNum * 100).toFixed(0),
            scene: this.data.scene,
            session: res.data
          },
          method: 'GET',
          header: {
            'content-type': 'application/json'
          },
          success: r => {
            console.log(r)
            // timeStamp nonceStr package signType paySign
            var timp = (Date.now() / 1000).toFixed(0)
            var str = `nonceStr=${r.data.nonceStr}&package=prepay_id=${r.data.package}&signType=MD5&timeStamp=${timp}`
            
            console.log(str)
            wx.request({
              url: 'https://www.drawing-attractions.com/Zan/GetMD5Str',
              data: {
                str: str
              },
              method: 'POST',
              header: {
                'content-type': 'application/json'
              },
              success: r1 => {
                var o = {
                  timeStamp: '' + timp,
                  nonceStr: r.data.nonceStr,
                  package: 'prepay_id=' + r.data.package,
                  signType: 'MD5',
                  paySign: r1.data,
                }
                console.log(o)
                wx.requestPayment({
                  timeStamp: '' + timp,
                  nonceStr: r.data.nonceStr,
                  package: 'prepay_id=' + r.data.package,
                  signType: 'MD5',
                  paySign: r1.data,
                  success: res => {
                    console.log(res)
                    wx.navigateTo({
                      url: `/pages/payresult/payresult?money=${this.data.payNum}&success=true`
                    })
                  },
                  fail: err => {
                    console.log(err)
                    // wx.navigateTo({
                    //   url: '/pages/payresult/payresult?money=1&success=false'
                    // })
                  }
                })
              }
            })
          }
        })
      },
    })
    if (!this.data.payNum && this.data.payNum !== 0) {
      wx.showLoading({
        title: '请输入数字',
        mask: true
      })
    } else {
      wx.showLoading({
        title: '支付' + this.data.payNum + '元',
        mask: true
      })
    }
    
    setTimeout(function(){
      wx.hideLoading()
    },2000)
  },
  changeTab: function (e) {
    console.log(e)
    app.globalData.tabNum = e.detail.indexNum
    console.log(app.globalData.tabNum)
  },
  changeNowIndex: function(e) {
    console.log('改变', e)
    console.log(e.target.dataset.index)
    this.setData({
      nowIndex: e.target.dataset.index,
      payNum: this.data.money[e.target.dataset.index]
    })
  },
  inputMoney: function (e) {
    console.log('改')
    if (this.data.inputMoneyNum == '其它金额') {
      this.setData({
        inputMoneyNum: ''
      })
    } else {
      this.setData({
        inputMoneyNum: this.data.inputMoneyNum.replace('元', '')
      })
    }
    
    this.setData({
      nowIndex: e.target.dataset.index
    })
  },
  addYuan: function (e) {
    var num = e.detail.value;
    if (!e.detail.value) {
      this.setData({
        inputMoneyNum: '其它金额',
        payNum: null
      })
      return
    }
    if (isNaN(e.detail.value)) {
      wx.showLoading({
        title: '请输入合法数字',
        mask: true
      })
      setTimeout(function () {
        wx.hideLoading()
      }, 2000)
      this.setData({
        inputMoneyNum: '其它金额',
        payNum: null
      })
      return
    }
    if (num.indexOf('.') === 0) {
      console.log(num)
      num = '0' + num
    }
    if (num.indexOf('.') > 0 && num.split('.')[1].length > 2) {
      this.setData({
        inputMoneyNum: (+num).toFixed(2) + '元',
        payNum: (+num).toFixed(2)
      })
      return
    }
    this.setData({
      inputMoneyNum: num + '元',
      payNum: num
    })
  }
})
