module.exports = {
  apps : [{
    name   : "Conference",
    script : "npm",
    args   : "run start",
    env_production: {
      NODE_ENV: "production",
      SESSION_SECRET: "d944cf516514ff88a7df9001384b0981ccd5b2457b7c9939ba47ccbd9bbd6a4a",
      // Đảm bảo các biến môi trường khác cần thiết cho production cũng ở đây nếu có
    }
  }]
}
