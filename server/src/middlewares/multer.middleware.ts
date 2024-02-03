import multer from 'multer';
import { v4 as  uuid} from "uuid" 


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
export const singleUpload = multer({ storage: storage }).single("photo")