DELIMITER //
DROP PROCEDURE IF EXISTS msg_record //
CREATE PROCEDURE msg_record(IN from_hid char(40), IN to_hid char(40), IN content varchar(4000), IN date_ bigint)
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
END; //
DELIMITER ;
