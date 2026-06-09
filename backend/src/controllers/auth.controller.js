import RegisterService from '../services/register.service.js';
import LoginService from '../services/login.service.js';

class AuthController {
  async register(req, res) {
    try {
      const user = await RegisterService.execute(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const data = await LoginService.execute(req.body);
      return res.json(data);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export default new AuthController();
