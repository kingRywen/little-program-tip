const app = getApp()

Page({
  data: {
    pixelRatio: app.globalData.pixelRatio || 2,
    scene: app.globalData.scene,
    nowIndex: 0,
    money: [0,0,0,0,0],
    inputMoneyNum: '其它金额',
    userInfo: {},
    hasUserInfo: false,
    payNum: '',
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    tabNum: '',
    show: false,
    val: null,
    len: 20,
    prop: null,
    showImg: true,
    canvasShow: false,
    chooseImg: ''
  },
  onHide: function () {
    this.setData({
      canvasShow: false
    })
  },

  //事件处理函数
  bindViewTap: function() {
    app.globalData.prev = true
    // this.selectTap()
    wx.chooseImage({
      count: 1,
      success: (res) => {
        console.log('选择的图片', res.tempFilePaths)

        // 选择图片后开始裁切
        // 先导入图片到裁剪组件
        this.setData({
          canvasShow: true,
          chooseImg: res.tempFilePaths
        })
        
        
        let userInfo = Object.assign(this.data.userInfo, {
          m_HeadUrl: res.tempFilePaths[0]
        })
        this.setData({
          userInfo: userInfo
        })
      },
    })
  },
  onLoad: function () {
    var pages = getCurrentPages()
    console.log('currentPage', pages)
    var currentPage = pages[pages.length - 1]
    var url = currentPage.route
    var tabNum = 0
    console.log('url', url)

    console.log('全局属性', app.globalData)
    this.setData({
      tabNum: tabNum
    })
    console.log(this.data)
    var money = []
    console.log('获取用户信息')
    if (app.globalData.userInfo) {
      // for (var key in app.globalData.userInfo) {
      //   if (key.indexOf('Money') === 0) money.push(app.globalData.userInfo[key])
      // }
      // this.setData({
      //   userInfo: app.globalData.userInfo,
      //   hasUserInfo: true,
      //   payNum: money[0],
      //   money: money
      // })
      this.afterData(app.globalData.userInfo)
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = userInfo => {
        this.afterData(userInfo)
        // for (var key in userInfo) {
        //   if (key.indexOf('Money') === 0) money.push(userInfo[key])
        // }
        // this.setData({
        //   userInfo: userInfo,
        //   hasUserInfo: true,
        //   payNum: money[0],
        //   money: money
        // })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getStorage({
        key: 'sessionID',
        success: function(res1) {
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
              this.afterData(res.data)
            }
          })
        }
      })
      
    }
    
  },
  onPullDownRefresh: function () {
    console.log('开始刷新')
    wx.getStorage({
      key: 'sessionID',
      success: (res) => {
        var money = []
        wx.request({
          url: 'https://www.drawing-attractions.com/Zan/GetUserBySession',
          data: {
            session: res.data
          },
          method: 'GET',
          header: {
            'content-type': 'application/json'
          },
          success: res => {
            console.log('请求到数据')
            app.globalData.userInfo = res.data
            for (var key in res.data) {
              if (key.indexOf('Money') === 0) money.push(res.data[key])
            }
            this.setData({
              userInfo: res.data,
              hasUserInfo: true,
              payNum: money[0],
              money: money
            })
            wx.stopPullDownRefresh()
          }
        })
      }
    })
    
  },
  saveVal: function (e) {
    console.log(e)
    var userInfo = Object.assign(this.data.userInfo, {
      [e.detail.prop]: e.detail.val
    })
    console.log(userInfo)
    this.setData({
      show: false,
      userInfo: userInfo
    })
    wx.setNavigationBarTitle({
      title: '打赏页设置',
    })
  },
  cancel: function (e) {
    this.setData({
      show: false
    })
    wx.setNavigationBarTitle({
      title: '打赏页设置',
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
            this.afterData(res.data)
            
            // var money = []
            // for (var key in userInfo) {
            //   if (key.indexOf('Money') === 0) money.push(userInfo[key])
            // }
            // app.globalData.userInfo = userInfo
            // this.setData({
            //   userInfo: userInfo,
            //   hasUserInfo: true,
            //   payNum: money[0],
            //   money: money
            // })
            // this.isHeadUrl(res.data)
          }
        })
      }
    })
    
  },
  setName: function () {
    wx.setNavigationBarTitle({
      title: '修改名字',
    })
    this.setData({
      show: true,
      val: this.data.userInfo.m_Name,
      prop: 'm_Name'
    })
  },
  // 请求到数据之后的操作
  afterData: function (userInfo) {
    var money = []
    for (var key in userInfo) {
      if (key.indexOf('Money') === 0) money.push(userInfo[key])
    }
    app.globalData.userInfo = userInfo
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true,
      payNum: money[0],
      money: money
    })
    this.isHeadUrl(userInfo)
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

  
  setRemark: function () {
    wx.setNavigationBarTitle({
      title: '修改签名',
    })
    this.setData({
      show: true,
      val: this.data.userInfo.m_Remark,
      prop: 'm_Remark'
    })
  },

  goTo: function () {
    let money = this.data.money.join('/')
    wx.navigateTo({
      url: `/pages/client/client?prev=1&money=${money}&name=${this.data.userInfo.m_Name}&remark=${this.data.userInfo.m_Remark}&headurl=${this.data.userInfo.m_HeadUrl}`,
    })
  },
  setInput: function (e) {
    console.log(e)
    if (isNaN(e.detail.value)) {
      
      return ''
    } else if (e.detail.value.indexOf('.') >= 0 && e.detail.value.split('.')[1].length >= 2) {
      if (e.detail.value < 10) {
        
        this.data.money.splice(e.target.dataset.index, 1, Number(e.detail.value).toFixed(2))
        this.setData({
          money: this.data.money
        })
        return Number(e.detail.value).toFixed(2)
      } else {
        this.data.money.splice(e.target.dataset.index, 1, Number(e.detail.value).toFixed(1))
        this.setData({
          money: this.data.money
        })
        return Number(e.detail.value).toFixed(1)
      }
    } else if (e.detail.value > 999){
      this.data.money.splice(e.target.dataset.index, 1, e.detail.value.substring(0, 3))
      this.setData({
        money: this.data.money
      })
      return e.detail.value.substring(0,3)
    } else {
      this.data.money.splice(e.target.dataset.index, 1, e.detail.value)
      this.setData({
        money: this.data.money
      })
      return Number(e.detail.value)
    }
    
  },
  save: function () {
    wx.showLoading({
      title: '正在保存',
      mask: true
    })
    var self = this
    wx.getStorage({
      key: 'sessionID',
      success: (res) => {
        let session = res.data
        if (!this.data.userInfo.m_HeadUrl) {
          wx.showToast({
            
            title: '请选择头像',
            icon: 'loading',
            duration:2000
          })
          return
        }
        // 上传头像
        console.log(this.data.userInfo)
        wx.uploadFile({
          url: 'https://www.drawing-attractions.com/Zan/UploadImage',
          filePath: this.data.userInfo.m_HeadUrl,
          name: 'file',
          formData: {
            'session': res.data
          },
          success: res => {
            console.log(res)

            // 下载头像
            
            wx.downloadFile({
              url: 'https://www.drawing-attractions.com/Zan/DownloadHeadImage?session=' + session,
              header: {
                'content-type': 'image/jpeg'
              },
              success: res => {
                console.log(res.tempFilePath)
                wx.saveFile({
                  tempFilePath: res.tempFilePath,
                  success: res => {
                    console.log(res.savedFilePath, this.data.userInfo)
                    self.data.userInfo.m_HeadUrl = res.savedFilePath
                    app.globalData.userInfo.m_HeadUrl = res.savedFilePath

                    self.setData({
                      userInfo: self.data.userInfo
                    })
                    this.update(session, res.savedFilePath)
                    
                  }
                })
              },
              fail: e => {
                console.log(e)
              }
            })
          },
          fail: res => {
            console.log(res)
            wx.showToast({
              title: '上传失败，请重试',
              icon: 'loading',
              duration: 2000,
              mask: true
            })
          }
        })

        

        
      },
      fail: function () {
        wx.showToast({
          title: '请重新登录',
          duration: 2000
        })

      }
      
    })
    
  },
  update: function (session, path) {
    // 更新数据
    wx.request({
      url: 'https://www.drawing-attractions.com/Zan/UpdateFun',
      method: 'POST',
      header: {
        'content-type': 'application/json' // 默认值
      },
      data: {
        Money1: this.data.money[0],
        Money2: this.data.money[1],
        Money3: this.data.money[2],
        Money4: this.data.money[3],
        Money5: this.data.money[4],
        m_Name: this.data.userInfo.m_Name,
        m_HeadUrl: path,
        m_Remark: this.data.userInfo.m_Remark,
        session: session,
      },
      success: function () {
        wx.hideLoading()
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: function () {
        wx.showToast({
          title: '服务器保存失败，请稍后再试',
          duration: 2000
        })
      },
      complete: () => {
        wx.getStorage({
          key: 'sessionID',
          success: (res) => {
            var money = []
            wx.request({
              url: 'https://www.drawing-attractions.com/Zan/GetUserBySession',
              data: {
                session: res.data
              },
              method: 'GET',
              header: {
                'content-type': 'application/json'
              },
              success: res => {
                app.globalData.userInfo = res.data
                for (var key in res.data) {
                  if (key.indexOf('Money') === 0) money.push(res.data[key])
                }
                this.setData({
                  userInfo: res.data,
                  hasUserInfo: true,
                  payNum: money[0],
                  money: money
                })
              }
            })
          }
        })
      }
    })
  },
  changeTab: function (e) {
    console.log(e)
    app.globalData.tabNum = e.detail.indexNum
    console.log(app.globalData.tabNum)
  },
  openInput: function () {
    
  },
  changeNowIndex: function(e) {
    console.log('改变')
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
    if (isNaN(parseInt(e.detail.value))) {
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
  },
  onShow: function () {
    console.log('全局', app.globalData.prev)
    if (app.globalData.prev) {
      return
    }
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
  }
})
