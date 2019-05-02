'use strict'

const bodyParser = require('body-parser')
const express = require('express')
const realm = require('realm')
const app = express()
const moment = require('moment')

app.use(bodyParser.json())

let User = require('./models/User')
let Matkul = require('./models/Matkul')
let Jadwal = require('./models/Jadwal')
let Peserta = require('./models/Peserta')

let userRealm = new Realm({
    path: 'realm-db/user.realm',
    schema: [User.Schema]
})

let matkulRealm = new Realm({
    path: 'realm-db/matkul.realm',
    schema: [Matkul.Schema]
})

let jadwalRealm = new Realm({
    path: 'realm-db/jadwal.realm',
    schema: [Jadwal.Schema]
})

let pesertaRealm = new Realm({
    path: 'realm-db/peserta.realm',
    schema: [Peserta.Schema]
})

app.post('/tambahmahasiswa', (req, res) => {
    let nrp = req.body.nrp
    let password = req.body.password
    let nama = req.body.nama

    if (password && nrp && nama) {
        userRealm.write(() => {
            userRealm.create('User', {
                nrp: nrp,
                nama: nama,
                password: password,
            })
        })

        res.status(201)
            .json({
                message: "User created"
            })

    }
    else {
        res.status(400)
            .json({
                message: "Parameter not complete"
            })
    }
})

app.post('/absen', (req, res) => {
    let ruang = req.body.ruang
    let nrp = req.body.nrp

    if (ruang && nrp) {
        let jadwal = jadwalRealm.objects('Jadwal').filtered(
            'ruang = "' + ruang + '"'
        )

        let todayTime = new Date()
        let idMatkul = ""
        let pertemuanKe = "1"

        for (var i = 0; i < jadwal.length; i++) {
            let jamMasuk = jadwal[i].jamMasuk
            let jamSelesai = jadwal[i].jamSelesai

            if (todayTime.getDate() == jamMasuk.getDate() && todayTime.getMonth() == jamMasuk.getMonth()) {
                if (todayTime.getHours() >= jamMasuk.getHours() && todayTime.getHours() <= jamSelesai.getHours()) {
                    if (todayTime.getMinutes() <= jamSelesai.getMinutes()) {
                        idMatkul = jadwal[i].idMatkul;
                        pertemuanKe = jadwal[i].pertemuanKe.toString();

                        break;
                    }
                }
            }
        }

        let peserta = pesertaRealm.objects('Peserta').filtered(
            'nrp = "' + nrp + '"' + ' AND ' + 'idMatkul = "' + idMatkul + '"'
        )

        pesertaRealm.write(() => {
            peserta[0]["p" + pertemuanKe] = 1
        })

        console.log(peserta[0])

        res.status(200).json({ message: "Success" })
    }
    else {
        res.status(400)
            .json({
                message: "Parameter not complete or key is wrong"
            })
    }
})

app.post('/tambahpeserta/:idmatakuliah/:kelas/:nrp', (req, res) => {
    let kelas = req.params.kelas
    let idMatkul = req.params.idmatakuliah + "-" + kelas
    let nrp = req.params.nrp
    console.log(idMatkul)
    if (idMatkul && nrp && kelas) {
        if (isIdMatkulExists(idMatkul) && isNrpExists(nrp)) {

            pesertaRealm.write(() => {
                pesertaRealm.create('Peserta', {
                    idMatkul: idMatkul,
                    nrp: nrp
                })
            })

            res.status(201)
                .json({
                    message: "Peserta added"
                })
        }
        else {
            res.status(404)
                .json({
                    message: "ID Matkul or NRP is not exists"
                })
        }
    }
    else {
        res.status(400)
            .json({
                message: "Parameter not complete or key is wrong"
            })
    }
})

app.post('/tambahmatkul', (req, res) => {
    let idMatkul = req.body.idmatkul
    let namaMatkul = req.body.namamatkul
    let kelas = req.body.kelas

    if (idMatkul && namaMatkul && kelas) {
        matkulRealm.write(() => {
            matkulRealm.create('Matkul', {
                idMatkul: idMatkul + "-" + kelas,
                namaMatkul: namaMatkul,
            })
        })

        res.status(201)
            .json({
                message: "Matkul created"
            })
    }
    else {
        res.status(400)
            .json({
                message: "Parameter not complete or key is wrong"
            })
    }
})

app.post('/tambahjadwal', (req, res) => {
    let idMatkul = req.body.idmatkul
    let pertemuanKe = req.body.pertemuanke
    let ruang = req.body.ruangkelas
    let jamMasuk = req.body.jammasuk
    let jamSelesai = req.body.jamselesai

    if (idMatkul && pertemuanKe && ruang && jamMasuk && jamSelesai) {
        if (isIdMatkulExists(idMatkul)) {
            jadwalRealm.write(() => {
                jadwalRealm.create('Jadwal', {
                    idMatkul: idMatkul,
                    pertemuanKe: pertemuanKe,
                    ruang: ruang,
                    jamMasuk: jamMasuk,
                    jamSelesai: jamSelesai
                })
            })

            res.status(201)
                .json({
                    message: "Jadwal created"
                })
        }
        else {
            res.status(404)
                .json({
                    message: "Mata kuliah with this ID not exists"
                })
        }
    }
    else {
        res.status(400)
            .json({
                message: "Parameter not complete"
            })
    }

})

app.get('/', (req, res) => {
    let user = userRealm.objects('User')
    let matkul = matkulRealm.objects('Matkul')
    let jadwal = jadwalRealm.objects('Jadwal')
    let peserta = pesertaRealm.objects('Peserta')

    res.json({
        user: user,
        matkul: matkul,
        jadwal: jadwal,
        peserta: peserta
    })
})

app.get('/rekap/:idmatakuliah/:pertemuanke', (req, res) => {
    let idMatkul = req.params.idmatakuliah
    let pertemuanKe = req.params.pertemuanke
})

app.get('/rekapmahasiswa/:nrp/:id', (req, res) => {
    let nrp = req.params.nrp
    let idMatkul = req.params.idmatakuliah
    let idSemester = req.params.idsemester
})

app.get('/delete', (req, res) => {
    userRealm.write(() => {
        let users = userRealm.objects('User')
        userRealm.deleteAll()
    })

    matkulRealm.write(() => {
        let matkul = matkulRealm.objects('Matkul')
        matkulRealm.deleteAll()
    })

    jadwalRealm.write(() => {
        let jadwal = jadwalRealm.objects('Jadwal')
        jadwalRealm.deleteAll()
    })

    pesertaRealm.write(() => {
        let peserta = pesertaRealm.objects('Peserta')
        pesertaRealm.deleteAll()
    })

    res.send("Deleted")
})

app.listen(3001, () => {
    console.log("API Server started")
})

function parseDate(s) {
    let tgl = moment(s)
    return tgl.utc().format('HH:mm:ss')
}

function isIdMatkulExists(id) {
    let matkul = matkulRealm.objects('Matkul').filtered(
        'idMatkul = "' + id + '"'
    )

    if (matkul.length == 0) {
        return false
    }
    else {
        return true
    }
}

function isNrpExists(nrp) {
    let user = userRealm.objects('User').filtered(
        'nrp = "' + nrp + '"'
    )

    if (user.length == 0) {
        return false
    }
    else {
        return true
    }
}
