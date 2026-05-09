const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

let adminSerialCodes = [
    { code: 'WRXNB', expiresAt: null }
];

function generateSerialCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 32; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function isValidSerial(code) {
    const serial = adminSerialCodes.find(s => s.code === code);
    if (!serial) return false;
    if (serial.expiresAt && Date.now() > serial.expiresAt) {
        adminSerialCodes = adminSerialCodes.filter(s => s.code !== code);
        return false;
    }
    return true;
}

function cleanExpiredSerials() {
    adminSerialCodes = adminSerialCodes.filter(s => !s.expiresAt || Date.now() <= s.expiresAt);
}

const db = new sqlite3.Database('database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

function initDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT,
            salt TEXT NOT NULL,
            isAdmin INTEGER DEFAULT 0,
            createdAt TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS wallpapers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            uploadTime TEXT NOT NULL,
            userId INTEGER,
            folderId INTEGER
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            details TEXT,
            timestamp TEXT NOT NULL,
            userId INTEGER,
            FOREIGN KEY (userId) REFERENCES users(id)
        )
    `);
}

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '.')));

function validateUsername(username) {
    if (!username) return { valid: false, message: '用户名不能为空' };
    
    const chineseChars = username.match(/[\u4e00-\u9fa5]/g) || [];
    const englishChars = username.match(/[a-zA-Z0-9]/g) || [];
    const otherChars = username.match(/[^a-zA-Z0-9\u4e00-\u9fa5]/g) || [];
    
    if (otherChars.length > 0) {
        return { valid: false, message: '用户名只能包含中文、英文和数字' };
    }
    
    if (chineseChars.length > 8) {
        return { valid: false, message: '中文用户名最长8个字符' };
    }
    
    const totalLength = chineseChars.length + englishChars.length;
    if (totalLength < 6 || totalLength > 12) {
        return { valid: false, message: '用户名长度需在6-12位之间' };
    }
    
    return { valid: true };
}

app.post('/api/register', (req, res) => {
    const { username, password, email, isAdmin, adminSerial } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        return res.status(400).json({ success: false, message: usernameValidation.message });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, message: '密码长度至少为6位' });
    }

    if (isAdmin) {
        if (!adminSerial || !isValidSerial(adminSerial.toUpperCase())) {
            return res.status(400).json({ success: false, message: '管理员序列号无效或已过期' });
        }
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    db.run(
        'INSERT INTO users (username, password, email, salt, isAdmin, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [username, hashedPassword, email || null, salt, isAdmin ? 1 : 0, new Date().toISOString()],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ success: false, message: '用户名已存在' });
                }
                return res.status(500).json({ success: false, message: '注册失败' });
            }

            db.run(
                'INSERT INTO logs (action, details, timestamp, userId) VALUES (?, ?, ?, ?)',
                ['注册成功', JSON.stringify({ username, email, isAdmin }), new Date().toISOString(), this.lastID]
            );

            res.json({ success: true, message: '注册成功' });
        }
    );
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, message: '登录失败' });
        }

        if (!user) {
            db.run(
                'INSERT INTO logs (action, details, timestamp) VALUES (?, ?, ?)',
                ['登录失败', JSON.stringify({ username, reason: '用户不存在' }), new Date().toISOString()]
            );
            return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }

        const isValid = bcrypt.compareSync(password, user.password);

        if (!isValid) {
            db.run(
                'INSERT INTO logs (action, details, timestamp) VALUES (?, ?, ?)',
                ['登录失败', JSON.stringify({ username, reason: '密码错误' }), new Date().toISOString()]
            );
            return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }

        db.run(
            'INSERT INTO logs (action, details, timestamp, userId) VALUES (?, ?, ?, ?)',
            ['登录成功', JSON.stringify({ username, isAdmin: user.isAdmin }), new Date().toISOString(), user.id]
        );

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin === 1,
                createdAt: user.createdAt
            }
        });
    });
});

app.post('/api/wallpapers', (req, res) => {
    const { name, data, userId, folderId } = req.body;

    if (!name || !data) {
        return res.status(400).json({ success: false, message: '请提供壁纸名称和数据' });
    }

    db.run(
        'INSERT INTO wallpapers (name, data, uploadTime, userId, folderId) VALUES (?, ?, ?, ?, ?)',
        [name, data, new Date().toISOString(), userId || null, folderId || null],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: '上传失败' });
            }

            if (folderId) {
                db.run('UPDATE folders SET updatedAt = ? WHERE id = ?', [new Date().toISOString(), folderId]);
            }

            db.run(
                'INSERT INTO logs (action, details, timestamp, userId) VALUES (?, ?, ?, ?)',
                ['上传壁纸', JSON.stringify({ name, id: this.lastID, folderId }), new Date().toISOString(), userId]
            );

            res.json({ success: true, id: this.lastID });
        }
    );
});

app.post('/api/folders', (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ success: false, message: '请提供文件夹名称' });
    }

    db.get('SELECT id FROM folders WHERE name = ?', [name], (err, existing) => {
        if (err) {
            return res.status(500).json({ success: false, message: '查询失败' });
        }
        
        if (existing) {
            return res.status(400).json({ success: false, message: '文件夹名称已存在' });
        }

        const now = new Date().toISOString();
        db.run(
            'INSERT INTO folders (name, createdAt, updatedAt) VALUES (?, ?, ?)',
            [name, now, now],
            function(err) {
                if (err) {
                    return res.status(500).json({ success: false, message: '创建失败' });
                }
                res.json({ success: true, id: this.lastID });
            }
        );
    });
});

app.get('/api/folders', (req, res) => {
    db.all('SELECT * FROM folders ORDER BY updatedAt DESC', (err, folders) => {
        if (err) {
            return res.status(500).json({ success: false, message: '获取失败' });
        }
        res.json({ success: true, folders });
    });
});

app.put('/api/folders/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ success: false, message: '请提供文件夹名称' });
    }

    db.run(
        'UPDATE folders SET name = ?, updatedAt = ? WHERE id = ?',
        [name, new Date().toISOString(), id],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: '更新失败' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: '文件夹不存在' });
            }
            res.json({ success: true });
        }
    );
});

app.delete('/api/folders/:id', (req, res) => {
    const { id } = req.params;

    db.serialize(() => {
        db.run('DELETE FROM wallpapers WHERE folderId = ?', [id]);
        db.run('DELETE FROM folders WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: '删除失败' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: '文件夹不存在' });
            }
            res.json({ success: true });
        });
    });
});

app.get('/api/wallpapers', (req, res) => {
    const { folderId } = req.query;
    let query = 'SELECT * FROM wallpapers ORDER BY uploadTime DESC';
    let params = [];
    
    if (folderId) {
        query = 'SELECT * FROM wallpapers WHERE folderId = ? ORDER BY uploadTime DESC';
        params = [folderId];
    }
    
    db.all(query, params, (err, wallpapers) => {
        if (err) {
            return res.status(500).json({ success: false, message: '获取失败' });
        }
        res.json({ success: true, wallpapers });
    });
});

app.delete('/api/wallpapers/:id', (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;

    db.get('SELECT folderId FROM wallpapers WHERE id = ?', [id], (err, wallpaper) => {
        if (err) {
            return res.status(500).json({ success: false, message: '删除失败' });
        }
        
        db.run('DELETE FROM wallpapers WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: '删除失败' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: '壁纸不存在' });
            }

            if (wallpaper && wallpaper.folderId) {
                db.run('UPDATE folders SET updatedAt = ? WHERE id = ?', [new Date().toISOString(), wallpaper.folderId]);
            }

            db.run(
                'INSERT INTO logs (action, details, timestamp, userId) VALUES (?, ?, ?, ?)',
                ['删除壁纸', JSON.stringify({ id }), new Date().toISOString(), userId]
            );

            res.json({ success: true });
        });
    });
});

app.post('/api/admin/serial', (req, res) => {
    const { duration } = req.body;
    const expiresIn = (duration || 5) * 60 * 1000;
    const newCode = generateSerialCode();
    
    adminSerialCodes.push({
        code: newCode,
        expiresAt: Date.now() + expiresIn
    });
    
    res.json({
        success: true,
        code: newCode,
        expiresIn: Math.floor(expiresIn / 1000 / 60) + '分钟',
        expiresAt: new Date(Date.now() + expiresIn).toLocaleString('zh-CN')
    });
});

app.get('/api/admin/serials', (req, res) => {
    cleanExpiredSerials();
    res.json({
        success: true,
        serials: adminSerialCodes.map(s => ({
            code: s.code,
            expiresAt: s.expiresAt ? new Date(s.expiresAt).toLocaleString('zh-CN') : '永久有效',
            isExpired: s.expiresAt && Date.now() > s.expiresAt
        }))
    });
});

app.delete('/api/admin/serial/:code', (req, res) => {
    const { code } = req.params;
    const initialLength = adminSerialCodes.length;
    adminSerialCodes = adminSerialCodes.filter(s => s.code !== code);
    
    if (adminSerialCodes.length < initialLength) {
        res.json({ success: true, message: '序列号已删除' });
    } else {
        res.status(404).json({ success: false, message: '序列号不存在' });
    }
});

app.get('/api/logs', (req, res) => {
    db.all('SELECT * FROM logs ORDER BY timestamp DESC', (err, logs) => {
        if (err) {
            return res.status(500).json({ success: false, message: '获取失败' });
        }
        res.json({ success: true, logs });
    });
});

app.get('/api/users', (req, res) => {
    db.all('SELECT id, username, email, isAdmin, createdAt FROM users ORDER BY createdAt DESC', (err, users) => {
        if (err) {
            return res.status(500).json({ success: false, message: '获取失败' });
        }
        res.json({ success: true, users });
    });
});

app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: '删除失败' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        res.json({ success: true });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});