const db = require("../db/db");

const login = (req, res) => {
  const { email, name } = req.body;
  db.query(
    "SELECT * FROM students WHERE email = ?",
    [email],
    (err, results, fields) => {
      if (err) {
        throw new Error(err);
      }
      if (results.length === 0) {
        db.query(
          "INSERT INTO students (sid, name, email) VALUES (?, ?, ?)",
          [parseInt(name.substr(2, 10)), name.substr(11), email],
          (err, results, fields) => {
            if (err) {
              throw new Error(err);
            } else {
              res.status(200).send();
            }
          }
        );
      }
      res.status(200).send();
    }
  );
};

const getTimeTable = (req, res) => {
  const email = req.params.email;
  db.query(
    `SELECT
      class_id,
      tt_id,
      start_time,
      end_time,
      day,
      type,
      course_name,
      course_code
    FROM timetable t
    JOIN (SELECT
      class_id,
      sub_class_id,
      course_name,
      course_code
    FROM sub_class s
    JOIN classrooms c
      ON s.class_id = c.classroom_id
    WHERE sub_class_id IN (SELECT
      sub_class_id
    FROM stud_class
    WHERE sid IN (SELECT
      sid
    FROM students
    WHERE email = ?))) u
      ON t.sub_class_id = u.sub_class_id`,
    [email],
    (err, results, fields) => {
      if (err) throw new Error(err);
      res.status(200).send(results);
    }
  );
};

const getClassrooms = (req, res) => {
  const email = req.params.email;
  db.query(
    `SELECT
      M.name,
      N.class_id,
      N.grp_no,
      N.course_name,
      N.course_code
    FROM (SELECT
      A.name,
      sub_class_id
    FROM (SELECT
      *
    FROM teachers
    WHERE teachers.tid IN (SELECT
      tid
    FROM teach_class
    WHERE sub_class_id IN (SELECT
      sub_class_id
    FROM stud_class
    WHERE stud_class.sid IN (SELECT
      sid
    FROM students
    WHERE email = ?)))) A
    JOIN (SELECT
      *
    FROM teach_class
    WHERE sub_class_id IN (SELECT
      sub_class_id
    FROM stud_class
    WHERE stud_class.sid IN (SELECT
      sid
    FROM students
    WHERE email = ?))) B
      ON A.tid = B.tid) M
    JOIN (SELECT
      *
    FROM (SELECT
      *
    FROM sub_class
    WHERE sub_class.sub_class_id IN (SELECT
      sub_class_id
    FROM stud_class
    WHERE stud_class.sid IN (SELECT
      sid
    FROM students
    WHERE email = ?))) X
    JOIN (SELECT
      *
    FROM classrooms
    WHERE classroom_id IN (SELECT
      class_id
    FROM sub_class
    WHERE sub_class_id IN (SELECT
      sub_class_id
    FROM stud_class
    WHERE stud_class.sid IN (SELECT
      sid
    FROM students
    WHERE email = ?)))) Y
      ON X.class_id = Y.classroom_id) N
      ON M.sub_class_id = N.sub_class_id`,
    [email, email, email, email],
    (err, results, fields) => {
      if(err) throw new Error(err);
      res.status(200).send(results);
    }
  );
};

const getQuiz = (req, res) => {
  const email = req.params.email;
  const classroom_id=req.params.id;
  db.query(
    `SELECT
      quiz_id,
      quiz_name,
      start_time,
      end_time,
      quiz_link,
      score_obtained,
      max_score
    FROM (SELECT
      email,
      sid
    FROM students) T
    RIGHT JOIN (SELECT
      R.quiz_id,
      quiz_name,
      start_time,
      end_time,
      quiz_link,
      score_obtained,
      max_score,
      sid
    FROM (SELECT
      *
    FROM quiz_result
    WHERE sid IN (SELECT
      sid
    FROM students
    WHERE email = ?)) Q
    RIGHT JOIN (SELECT
      *
    FROM quizzes
    WHERE quiz_id IN (SELECT
      quiz_id
    FROM quiz_subclass
    WHERE sub_class_id IN (SELECT
      sub_class_id
    FROM stud_class
    WHERE sid IN (SELECT
      sid
    FROM students
    WHERE email = ?))
    AND sub_class_id IN (SELECT
      sub_class_id
    FROM sub_class
    WHERE class_id = ?))) R
      ON Q.quiz_id = R.quiz_id) U
      ON T.sid = U.sid`,
    [email, email, classroom_id],
    (err, results, fields) => {
      if(err) throw new Error(err);
      res.status(200).send(results);
    }
  );
};

const getAllQuizzes = (req, res) =>
{
  const { email } = req.params;
  db.query(
    `SELECT
      *
    FROM quizzes
    WHERE quiz_id IN (SELECT
      quiz_id
    FROM quiz_subclass
    WHERE sub_class_id IN (SELECT
      sub_class_id
    FROM stud_class
    WHERE sid IN (SELECT
      sid
    FROM students
    WHERE email = ?)))`,
    [email],
    (err, results, fields) =>
    {
      if(err) throw new Error(err);
      res.send(results);
    }
  )
}

const getAssignment = (req, res) => {
  const email = req.params.email;
  const classroom_id=req.params.id;
  db.query(
    `SELECT X.assignment_id, assignment_name, submission_date, assignment_link, solution_link, submitted_at FROM (SELECT *
    FROM assignment
    WHERE assignment_id IN (SELECT
      assignment_id
    FROM assignment_subclass
    WHERE sub_class_id IN (SELECT
      A.sub_class_id
    FROM (SELECT
      sub_class_id
    FROM sub_class
    WHERE class_id = ?) A
    INNER JOIN (SELECT
      sub_class_id
    FROM stud_class
    WHERE sid IN (SELECT
      sid
    FROM students
    WHERE email = ?)) B
      ON A.sub_class_id = B.sub_class_id))) X LEFT OUTER JOIN (SELECT assignment_id, submitted_at, assignment_link as solution_link FROM stud_assignment WHERE sid IN (SELECT sid FROM students WHERE email=?)) Y
      ON X.assignment_id = Y.assignment_id`
    ,[classroom_id, email, email],
    (err, results, fields) => {
      if(err) throw new Error(err);
      res.status(200).send(results);
    }
  );
};

const getAllAssignments = (req, res) =>
{
  const { email } = req.params;
  db.query(
    `SELECT
      *
    FROM (SELECT
      assignment_id,
      submitted_at
    FROM stud_assignment
    WHERE sid IN (SELECT
      sid
    FROM students
    WHERE email = ?)) FIRSTTABLE
    RIGHT JOIN (SELECT
      X.assignment_id,
      assignment_name,
      submission_date,
      class_id
    FROM assignment X
    JOIN ((SELECT
      A.sub_class_id,
      class_id,
      assignment_id
    FROM assignment_subclass A
    JOIN (SELECT
      class_id,
      sub_class_id
    FROM sub_class
    WHERE sub_class_id IN (SELECT
      sub_class_id
    FROM stud_class
    WHERE sid IN (SELECT
      sid
    FROM students
    WHERE email = ?))) B
      ON A.sub_class_id = B.sub_class_id)) Y
      ON X.assignment_id = Y.assignment_id) SECONDTABLE
      ON FIRSTTABLE.assignment_id = SECONDTABLE.assignment_id;`,
    [email, email],
    (err, results, fields) =>
    {
      if(err) throw new Error(err);
      res.status(200).send(results);
    }
  )
}

const submitAssignment=(req,res)=>{
  const {email, assignment_id, submitted_at, link}=req.body;
  db.query(
    "SELECT sid FROM students WHERE email=?", [email],
    (err, results, fields) => {
      if(err) throw new Error(err);
      const sid=results[0].sid;
      db.query(
        "INSERT INTO stud_assignment (assignment_id, assignment_link, sid, submitted_at) VALUES (?, ?, ?, ?)"
        ,[assignment_id, link, sid, submitted_at],
        (err, results, fields) => {
          if(err) throw new Error(err);
          res.status(200).send(results);
        }
      );
    }
  ); 
}

const getResource = (req, res) => {
  const email = req.params.email;
  const classroom_id=req.params.id;
  db.query(
    "SELECT id, name, link, description, uploaded_at FROM resources WHERE id in (SELECT resource_id FROM sub_resources WHERE sub_class_id IN (SELECT A.sub_class_id FROM (SELECT sub_class_id FROM sub_class WHERE class_id=?) A INNER JOIN (SELECT sub_class_id FROM stud_class WHERE sid IN (SELECT sid FROM students WHERE email=?)) B ON A.sub_class_id=B.sub_class_id))",
    [classroom_id, email],
    (err, results, fields) => {
      if(err) throw new Error(err);
      res.status(200).send(results);
    }
  );
};


module.exports = { login, getTimeTable, getClassrooms, getQuiz, getAllQuizzes , getAssignment, getAllAssignments , submitAssignment, getResource};