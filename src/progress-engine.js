/* IELTS Focus progress engine */
(function (global) {
  'use strict';

  function dateKey(value) {
    const d = value ? new Date(value) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + day;
  }

  function summarize(attempts) {
    const list = Array.isArray(attempts) ? attempts : [];
    const bySkill = {};
    const byDay = {};
    let correct = 0, total = 0, durationSec = 0;

    for (const a of list) {
      const skill = a.skill || 'other';
      const day = dateKey(a.completedAt);
      bySkill[skill] ||= { attempts:0, correct:0, total:0, durationSec:0 };
      byDay[day] ||= { attempts:0, durationSec:0 };

      bySkill[skill].attempts++;
      byDay[day].attempts++;

      if (Number.isFinite(Number(a.correct)) && Number.isFinite(Number(a.total))) {
        bySkill[skill].correct += Number(a.correct);
        bySkill[skill].total += Number(a.total);
        correct += Number(a.correct);
        total += Number(a.total);
      }
      if (Number.isFinite(Number(a.durationSec))) {
        bySkill[skill].durationSec += Number(a.durationSec);
        byDay[day].durationSec += Number(a.durationSec);
        durationSec += Number(a.durationSec);
      }
    }

    return {
      attempts: list.length,
      correct,
      total,
      accuracy: total ? correct / total : null,
      durationSec,
      bySkill,
      byDay
    };
  }

  function requiredTasksForDay(day) {
    const d = day ? new Date(day) : new Date();
    const weekday = d.getDay();
    return weekday === 0 ? 3 : 2;
  }

  function dailyCompletion(requiredDone, optionalDone, day) {
    const required = requiredTasksForDay(day);
    const done = Math.max(0, Number(requiredDone) || 0);
    return {
      required,
      requiredDone: Math.min(done, required),
      optionalDone: Math.max(0, Number(optionalDone) || 0),
      complete: done >= required
    };
  }

  global.IELTSProgressEngine = Object.freeze({
    dateKey, summarize, requiredTasksForDay, dailyCompletion
  });
})(window);
