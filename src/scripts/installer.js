"use strict";

const platform = require("os").platform;
const { exec } = require("child_process");
const path = require('path');
const sudo = require('sudo-prompt');
const errors = global.ErrorCodes;


class Installer {

  constructor(settings) {
    
    this.zxpPath = __dirname + settings.zxpPath;
    this.extensionID = settings.extensionID;
    this.settings = settings;

    const prefix = (platform() == "darwin") ? "--" : "/"
    this.installCommand = `${prefix}install`;
    this.uninstallCommand = `${prefix}remove`;
    this.checkExtensionsCommand = `${prefix}list all`
    this.target = this.targetPath();

    this.install = this.install.bind(this);
  }

  targetPath() {

    switch (platform()) {
      case "darwin":
        return "bin/OSX/Contents/MacOS/ExManCmd";
      case "win32":
        return "bin/WINDOWS/ExManCmd.exe";
      case "win64":
        return "bin/WINDOWS/ExManCmd.exe";
    }
    return null;
  }

  checkStatus() {
    
    const that = this;
    const targetPath = path.join(__dirname, that.target);
    const command = [targetPath, this.checkExtensionsCommand].join(" ");

    console.log(`Checking if "${that.extensionID}" is installed...`);
    console.log("command:", command)

    return new Promise((resolve, reject) => {
      // use sudo.exec for forcing elevated privs
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.warn(stderr);
          return reject(error);
        }

        console.log({stdout, stderr});
        let extensionInstalled = stdout.includes(that.extensionID);

        return resolve({extensionInstalled});
      });
    });
  }

  install() {
    const that = this;
    const successfulMessage = "Installation Successful";
    const options = {
      name: `${this.productName} Installer`,
    }

    return new Promise(function (resolve, reject) {
      const command = [path.join(__dirname, that.target), that.installCommand, that.zxpPath].join(" ");
      
      sudo.exec(command, options, function(error, stdout, stderr) {
        
        console.log({stdout, stderr});
        if (error) {
          console.warn("error executing sudo");

          let message = error.message || "An unknown error occurred.";
          if (message.toLowerCase() === "user did not grant permission.") {
            message = message.replace("User", "You");
          }

          return reject(message);
        }

        if (stdout.includes(successfulMessage)) {
          return resolve();
        }

        reject(stderr || stdout);
      });

    });
  }

  uninstall() {
    throw new Error("Not Implemented");
  }

}

global.Installer = Installer;