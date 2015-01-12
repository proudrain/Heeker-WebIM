DELIMITER //
DROP PROCEDURE IF EXISTS get_message //
CREATE PROCEDURE get_message(IN heek_id char(40))
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
END; //
DELIMITER ;
