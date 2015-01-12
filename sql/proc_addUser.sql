DELIMITER //
DROP PROCEDURE IF EXISTS add_user //
CREATE PROCEDURE add_user(IN heekid_ char(40), IN password_ char(32), IN invitation char(10), OUT stat varchar(40))
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
END; //
DELIMITER ;
