'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "First Name is Required"
        }
      }
    },
    lastName: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Last Name is Required"
        }
      }
    },
    emailAddress: {
      type: DataTypes.STRING,
      validate: {
        isEmail: {
          msg: "Please enter a valid address. Example: foo@bar.com"
        }, 
        notEmpty: {
          msg: "Email Address is Required"
        }
      }
    },
    password: { 
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Please enter a valid password"
        }
      }
    }
  });

  User.associate = function(models) {
    // associations can be defined here
    User.hasMany(models.Course, {
      as: 'user',
      foreignKey: {
        fieldName: 'userId',
        allowNull: false,
      },
      validate: {
        notEmpty: {
          msg: "A user is required to create a course"
        }
      }
    });
  };
  return User;
};