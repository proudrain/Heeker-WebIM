DELIMITER //
DROP PROCEDURE IF EXISTS update_addrs //
CREATE PROCEDURE update_addrs(IN heekid_ char(40), IN add_heekid char(40), OUT stat varchar(40))
EXPORT: BEGIN
    DECLARE tmp char(40);
    DECLARE _err int DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION,SQLWARNING,NOT FOUND set _err=1;

    IF heekid_=add_heekid THEN
        SET stat = "addself";
        LEAVE EXPORT;
    END IF;

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
END; //
DELIMITER ;
