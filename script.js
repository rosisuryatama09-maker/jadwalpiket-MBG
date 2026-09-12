// =====================================================
// GOOGLE APPS SCRIPT URL
// =====================================================

const GOOGLE_SCRIPT_URL =
    "PASTE_URL_GOOGLE_APPS_SCRIPT_KAMU";


// =====================================================
// DATA
// =====================================================

let jadwal = [];


// =====================================================
// ELEMENT
// =====================================================

const jadwalTable =
    document.getElementById("jadwalTable");

const form =
    document.getElementById("jadwalForm");

const modal =
    document.getElementById("modal");

const overlay =
    document.getElementById("overlayLoading");

const loadingText =
    document.getElementById("loadingText");


// =====================================================
// CEK URL
// =====================================================

function apiReady() {

    return GOOGLE_SCRIPT_URL &&
        !GOOGLE_SCRIPT_URL.includes(
            "PASTE_URL"
        );
}


// =====================================================
// LOADING
// =====================================================

function showLoading(text = "Memproses...") {

    loadingText.textContent = text;

    overlay.classList.add("show");
}


function hideLoading() {

    overlay.classList.remove("show");
}


// =====================================================
// AMBIL DATA GOOGLE SHEETS
// =====================================================

async function loadJadwal() {

    if (!apiReady()) {

        jadwalTable.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    ⚠ Masukkan URL Google Apps Script
                    pada script.js terlebih dahulu.
                </td>
            </tr>
        `;

        return;
    }


    try {

        jadwalTable.innerHTML = `
            <tr>
                <td colspan="8" class="loading">
                    ⏳ Memuat data dari Google Sheets...
                </td>
            </tr>
        `;


        const response =
            await fetch(
                GOOGLE_SCRIPT_URL +
                "?action=jadwal&time=" +
                Date.now()
            );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "Gagal mengambil data"
            );
        }


        jadwal = result.data || [];

        tampilkanJadwal();

        updateStatistik();

    }
    catch (error) {

        console.error(error);

        jadwalTable.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    ❌ Gagal mengambil data dari Google Sheets.
                    <br>
                    Periksa URL Google Apps Script dan deployment.
                </td>
            </tr>
        `;
    }
}


// =====================================================
// TAMPILKAN JADWAL
// =====================================================

function tampilkanJadwal() {

    const search =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase();

    const filter =
        document
            .getElementById("filterStatus")
            .value;


    const data =
        jadwal.filter(item => {

            const cocokNama =
                String(item.nama)
                    .toLowerCase()
                    .includes(search);

            const cocokKelas =
                String(item.kelas)
                    .toLowerCase()
                    .includes(search);

            const cocokStatus =
                filter === "Semua" ||
                item.status === filter;


            return (
                (cocokNama || cocokKelas) &&
                cocokStatus
            );
        });


    if (data.length === 0) {

        jadwalTable.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    📭 Data jadwal belum tersedia.
                </td>
            </tr>
        `;

        return;
    }


    jadwalTable.innerHTML =
        data.map((item, index) => {

            const statusClass =
                item.status === "Sudah Diambil"
                    ? "sudah"
                    : "belum";


            return `

                <tr>

                    <td>${index + 1}</td>

                    <td>
                        <strong>
                            ${escapeHTML(item.nama)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(item.kelas)}
                    </td>

                    <td>
                        ${escapeHTML(item.hari)}
                    </td>

                    <td>
                        ${formatTanggal(item.tanggal)}
                    </td>

                    <td>
                        ${escapeHTML(item.jam)}
                    </td>

                    <td>
                        <span class="status ${statusClass}">
                            ${escapeHTML(item.status)}
                        </span>
                    </td>

                    <td>

                        <button
                            class="action-btn check-btn"
                            onclick="ubahStatus('${item.id}')"
                            title="Ubah Status"
                        >
                            ${item.status === "Sudah Diambil"
                                ? "↩️"
                                : "✅"
                            }
                        </button>

                        <button
                            class="action-btn delete-btn"
                            onclick="hapusJadwal('${item.id}')"
                            title="Hapus"
                        >
                            🗑️
                        </button>

                    </td>

                </tr>

            `;
        }).join("");
}


// =====================================================
// TAMBAH JADWAL KE GOOGLE SHEETS
// =====================================================

form.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        if (!apiReady()) {

            alert(
                "Masukkan URL Google Apps Script terlebih dahulu!"
            );

            return;
        }


        const data = {

            action: "add",

            nama:
                document
                    .getElementById("nama")
                    .value
                    .trim(),

            kelas:
                document
                    .getElementById("kelas")
                    .value
                    .trim(),

            hari:
                document
                    .getElementById("hari")
                    .value,

            tanggal:
                document
                    .getElementById("tanggal")
                    .value,

            jam:
                document
                    .getElementById("jam")
                    .value

        };


        try {

            showLoading(
                "Menyimpan jadwal ke Google Sheets..."
            );


            await kirimData(data);


            closeModal();

            form.reset();


            await loadJadwal();


            alert(
                "✅ Jadwal berhasil disimpan!"
            );

        }
        catch (error) {

            console.error(error);

            alert(
                "❌ Gagal menyimpan jadwal."
            );

        }
        finally {

            hideLoading();

        }

    }
);


// =====================================================
// KIRIM DATA POST
// =====================================================

async function kirimData(data) {

    const response =
        await fetch(
            GOOGLE_SCRIPT_URL,
            {
                method: "POST",

                body:
                    JSON.stringify(data)
            }
        );


    const result =
        await response.json();


    if (!result.success) {

        throw new Error(
            result.message ||
            "Terjadi kesalahan"
        );
    }


    return result;
}


// =====================================================
// UBAH STATUS
// =====================================================

async function ubahStatus(id) {

    const item =
        jadwal.find(
            data =>
                String(data.id) === String(id)
        );


    if (!item) return;


    const statusBaru =
        item.status === "Sudah Diambil"
            ? "Belum Diambil"
            : "Sudah Diambil";


    try {

        showLoading(
            "Mengubah status..."
        );


        await kirimData({

            action: "status",

            id: id,

            status: statusBaru

        });


        await loadJadwal();

    }
    catch (error) {

        console.error(error);

        alert(
            "❌ Gagal mengubah status."
        );

    }
    finally {

        hideLoading();

    }
}


// =====================================================
// HAPUS JADWAL
// =====================================================

async function hapusJadwal(id) {

    const yakin =
        confirm(
            "Yakin ingin menghapus jadwal ini?"
        );


    if (!yakin) return;


    try {

        showLoading(
            "Menghapus jadwal..."
        );


        await kirimData({

            action: "delete",

            id: id

        });


        await loadJadwal();


        alert(
            "🗑️ Jadwal berhasil dihapus."
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "❌ Gagal menghapus jadwal."
        );

    }
    finally {

        hideLoading();

    }
}


// =====================================================
// STATISTIK
// =====================================================

function updateStatistik() {

    const total =
        jadwal.length;

    const belum =
        jadwal.filter(
            item =>
                item.status ===
                "Belum Diambil"
        ).length;

    const sudah =
        jadwal.filter(
            item =>
                item.status ===
                "Sudah Diambil"
        ).length;


    document
        .getElementById("totalJadwal")
        .textContent = total;

    document
        .getElementById("belumDiambil")
        .textContent = belum;

    document
        .getElementById("sudahDiambil")
        .textContent = sudah;
}


// =====================================================
// FORMAT TANGGAL
// =====================================================

function formatTanggal(tanggal) {

    if (!tanggal) return "-";


    const date =
        new Date(tanggal + "T00:00:00");


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;
}


// =====================================================
// MODAL
// =====================================================

document
    .getElementById("addBtn")
    .addEventListener(
        "click",
        () => {

            modal.classList.add("show");

        }
    );


document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        closeModal
    );


function closeModal() {

    modal.classList.remove("show");
}


modal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === modal
        ) {

            closeModal();

        }

    }
);


// =====================================================
// SEARCH DAN FILTER
// =====================================================

document
    .getElementById("searchInput")
    .addEventListener(
        "input",
        tampilkanJadwal
    );


document
    .getElementById("filterStatus")
    .addEventListener(
        "change",
        tampilkanJadwal
    );


// =====================================================
// REFRESH
// =====================================================

document
    .getElementById("refreshBtn")
    .addEventListener(
        "click",
        async () => {

            showLoading(
                "Memperbarui data..."
            );

            await loadJadwal();

            hideLoading();

        }
    );


// =====================================================
// SIDEBAR MOBILE
// =====================================================

document
    .getElementById("menuBtn")
    .addEventListener(
        "click",
        () => {

            document
                .querySelector(".sidebar")
                .classList.toggle("show");

        }
    );


// =====================================================
// TANGGAL HARI INI
// =====================================================

function tampilkanTanggalHariIni() {

    const sekarang =
        new Date();


    document
        .getElementById("currentDate")
        .textContent =
        sekarang.toLocaleDateString(
            "id-ID",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
}


// =====================================================
// JALANKAN
// =====================================================

tampilkanTanggalHariIni();

loadJadwal();
