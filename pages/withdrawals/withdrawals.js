var util = require('../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    money: '-',
    disabled: true,
    inputMoney: '',
    big: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      money: options.money
    })
  },
  change: function (e) {
    let val = e.detail.value
    if (val.indexOf('.') >= 0 && val.split('.')[1].length > 2) {
      val = val.substring(0, val.indexOf('.') + 3)
    }
    this.setData({
      inputMoney: val
    })
    if(+val > this.data.money) {
      this.setData({
        big: true,
        disabled: true
      })
      return
    }
    if (val == '' || val == 0) {
      this.setData({
        big: false,
        disabled: true
      })
      return
    }
    this.setData({
      big: false,
      disabled: false
    })
  },
  submit: function () {
    wx.getStorage({
      key: 'sessionID',
      success: (res) => {
        wx.request({
          url: 'https://www.drawing-attractions.com/Zan/Withdrawals',
          data: {
            session: res.data,
            money: this.data.inputMoney * 100
          },
          method: 'POST',
          header: {
            'content-type': 'application/json'
          },
          success: res => {
            console.log(res.data)
            wx.navigateTo({
              url: `/pages/withdrawresult/withdrawresult?result=${res.data}&money=${this.data.inputMoney}`,
            })
          }
        })
      },
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.getStorage({
      key: 'sessionID',
      success: (res) => {
        wx.request({
          url: 'https://www.drawing-attractions.com/Zan/GetAccount',
          data: {
            session: res.data
          },
          method: 'GET',
          header: {
            'content-type': 'application/json'
          },
          success: res => {
            console.log(res.data)
            this.setData({
              money: util.formatMoney(res.data)
            })

          }
        })
      }
    })
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