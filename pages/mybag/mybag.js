var app = getApp()
var util = require('../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    money: '-'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getData()
  },
  getData: function () {
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
      },
    })
  },
  go: function () {
    wx.navigateTo({
      url: `/pages/withdrawals/withdrawals?money=${this.data.money}`,
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
    console.log('开始刷新')
    this.getData()
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