-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: 2015-01-12 06:36:24
-- 服务器版本： 5.6.17
-- PHP Version: 5.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- 创建用户并授权: `smsphp`
--
GRANT USAGE ON *.* TO 'smsphp'@'localhost' IDENTIFIED BY PASSWORD '*912923AF3C2304B69DCC5C8308BB23A94BB02616';

GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON `heeker`.* TO 'smsphp'@'localhost';
--
-- Database: `heeker`
--
CREATE DATABASE IF NOT EXISTS `heeker` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `heeker`;

DELIMITER $$
--
-- 存储过程
--
DROP PROCEDURE IF EXISTS `add_user`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `add_user`(IN heekid_ char(40), IN password_ char(32), IN invitation char(10), OUT stat varchar(40))
EXPORT: BEGIN
    DECLARE key_ char(5);
    DECLARE _err int DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION,SQLWARNING,NOT FOUND set _err=1;

    SELECT INVITE_KEY INTO key_
    FROM invitations
    WHERE INVITE_KEY = invitation;

    IF key_ IS NULL THEN
        SET stat = "invalid invitation";
        LEAVE EXPORT;
    END IF;

    INSERT INTO users(HEEKID, PASSWORD)
    VALUES (heekid_, password_);

    IF _err=1 THEN
        SET stat = "repeated heekid";
        ROLLBACK;
        LEAVE EXPORT;
    END IF;

    DELETE FROM invitations
    WHERE INVITE_KEY = invitation;
    SET stat = "ok";

    COMMIT;
END$$

DROP PROCEDURE IF EXISTS `get_message`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_message`(IN heek_id char(40))
BEGIN
    SELECT ufrom.HEEKID AS FROM_, uto.HEEKID AS TO_, CONTENT, DATE
    FROM messages, users ufrom, users uto
    WHERE FROMID = ufrom.ID AND TOID = uto.ID AND uto.HEEKID = heek_id
    ORDER BY DATE;

    DELETE FROM messages
    WHERE EXISTS (
        SELECT *
        FROM users
        WHERE users.ID = messages.TOID AND users.HEEKID = heek_id
    );
    COMMIT;
END$$

DROP PROCEDURE IF EXISTS `msg_record`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `msg_record`(IN from_hid char(40), IN to_hid char(40), IN content varchar(4000), IN date_ bigint)
EXPORT: BEGIN
    DECLARE fromid char(40);
    DECLARE toid char(40);

    SELECT ufirst.ID, ulast.ID INTO fromid, toid
    FROM users ufirst, users ulast
    WHERE ufirst.HEEKID = from_hid AND ulast.HEEKID = to_hid;

    IF fromid = toid THEN
        LEAVE EXPORT;
    END IF;

    INSERT INTO messages(FROMID, TOID, CONTENT, DATE)
    VALUES (fromid, toid, content, date_);
    COMMIT;
END$$

DROP PROCEDURE IF EXISTS `update_addrs`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `update_addrs`(IN heekid_ char(40), IN add_heekid char(40), OUT stat varchar(40))
EXPORT: BEGIN
    DECLARE tmp char(40);
    DECLARE _err int DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION,SQLWARNING,NOT FOUND set _err=1;

    SELECT ID INTO tmp
    FROM users
    WHERE HEEKID = add_heekid;

    IF tmp IS NULL THEN
        SET stat = "not found";
        LEAVE EXPORT;
    END IF;

    INSERT INTO addrs(HOST, GUEST)
    SELECT ufirst.ID, ulast.ID
    FROM users ufirst, users ulast
    WHERE (ufirst.HEEKID = heekid_ AND ulast.HEEKID = add_heekid) OR
          (ufirst.HEEKID = add_heekid AND ulast.HEEKID = heekid_);

    IF _err=1 THEN
        SET stat = "repeated";
        ROLLBACK;
        LEAVE EXPORT;
    END IF;

    SET stat = "ok";
    COMMIT;
END$$

--
-- 函数
--
DROP FUNCTION IF EXISTS `rand_string`$$
CREATE DEFINER=`root`@`localhost` FUNCTION `rand_string`(n INT) RETURNS varchar(255) CHARSET latin1
BEGIN
	DECLARE chars_str varchar(100) DEFAULT 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    DECLARE return_str varchar(255) DEFAULT '';
    DECLARE i INT DEFAULT 0;
    WHILE i < n DO
    SET return_str = concat(return_str,substring(chars_str , FLOOR(1 + RAND()*62 ),1));
    SET i = i +1;
    END WHILE;
    RETURN return_str;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- 表的结构 `addrs`
--

DROP TABLE IF EXISTS `addrs`;
CREATE TABLE IF NOT EXISTS `addrs` (
  `HOST` int(10) NOT NULL,
  `GUEST` int(10) NOT NULL,
  PRIMARY KEY (`HOST`,`GUEST`),
  KEY `GUEST_FK_USERS_ID` (`GUEST`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- 转存表中的数据 `addrs`
--

INSERT INTO `addrs` (`HOST`, `GUEST`) VALUES
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 1),
(12, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 12);

-- --------------------------------------------------------

--
-- 表的结构 `invitations`
--

DROP TABLE IF EXISTS `invitations`;
CREATE TABLE IF NOT EXISTS `invitations` (
  `ID_KEY` int(11) NOT NULL AUTO_INCREMENT,
  `INVITE_KEY` char(5) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`ID_KEY`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=11 ;

--
-- 转存表中的数据 `invitations`
--

INSERT INTO `invitations` (`ID_KEY`, `INVITE_KEY`) VALUES
(2, 'hwBgm'),
(3, 'MU3ms'),
(4, 'BMTWV'),
(5, '8x6Nt'),
(6, 'spu4L'),
(7, 'WN1yw');

-- --------------------------------------------------------

--
-- 表的结构 `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `FROMID` int(10) NOT NULL,
  `TOID` int(10) NOT NULL,
  `CONTENT` varchar(4000) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `DATE` bigint(20) NOT NULL,
  PRIMARY KEY (`FROMID`,`TOID`,`DATE`),
  KEY `TOID` (`TOID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `messages`
--

INSERT INTO `messages` (`FROMID`, `TOID`, `CONTENT`, `DATE`) VALUES
(1, 2, 'asdfdsf', 1420995932772),
(1, 5, '速度飞', 1420895843323);

-- --------------------------------------------------------

--
-- 表的结构 `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `ID` int(10) NOT NULL AUTO_INCREMENT COMMENT '系统ID',
  `HEEKID` char(40) COLLATE utf8_bin NOT NULL,
  `PASSWORD` char(32) COLLATE utf8_bin NOT NULL,
  `ONLINE` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `HEEKID` (`HEEKID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=13 ;

--
-- 转存表中的数据 `users`
--

INSERT INTO `users` (`ID`, `HEEKID`, `PASSWORD`, `ONLINE`) VALUES
(1, 'proudrain', '202cb962ac59075b964b07152d234b70', NULL),
(2, 'Mark', '202cb962ac59075b964b07152d234b70', NULL),
(3, 'L1sten', '', NULL),
(4, 'superlala', '', NULL),
(5, 'phithon', '', NULL),
(6, 'chenCody', '', NULL),
(7, 'koi', '', NULL),
(8, 'test_user1', '202cb962ac59075b964b07152d234b70', NULL),
(10, 'test_user2', '202cb962ac59075b964b07152d234b70', NULL),
(11, 'test_user3', '202cb962ac59075b964b07152d234b70', NULL),
(12, 'test4', '202cb962ac59075b964b07152d234b70', NULL);

--
-- 限制导出的表
--

--
-- 限制表 `addrs`
--
ALTER TABLE `addrs`
  ADD CONSTRAINT `GUEST_FK_USERS_ID` FOREIGN KEY (`GUEST`) REFERENCES `users` (`ID`),
  ADD CONSTRAINT `HOST_FK_USERS_ID` FOREIGN KEY (`HOST`) REFERENCES `users` (`ID`);

--
-- 限制表 `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`FROMID`) REFERENCES `users` (`ID`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`TOID`) REFERENCES `users` (`ID`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
