'use strict';
module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: { 
      type:DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Title is required"
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      validate: {
        notEmpty: {
          msg: "Description is required"
        }
      }
    },
    estimatedTime: {
      type:DataTypes.STRING,
      allowNull:true
    },
    materialsNeeded: { 
      type: DataTypes.STRING,
      allowNull:true,
    },
  });
  
  Course.associate = function(models) {
    Course.belongsTo(models.User, {
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
    // associations can be defined here
  };
  return Course;
};